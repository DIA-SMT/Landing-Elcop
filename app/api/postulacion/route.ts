import { NextResponse } from "next/server";

import { convocatoriaAbierta } from "@/lib/convocatoria";
import { guardar } from "@/lib/postulaciones";
import { validarPostulacion, type ValoresPostulacion } from "@/lib/postulacion-validacion";

/**
 * Recepción de postulaciones.
 *
 * Hasta la migración 0003 esto era un tapón: validaba que el cuerpo fuera un
 * objeto, logueaba y devolvía 200 sin guardar nada. Ahora persiste en la tabla
 * `postulaciones`.
 *
 * Tres cosas que conviene defender:
 *
 * 1. **Se valida de nuevo acá.** Nada obliga a pasar por el formulario para
 *    postear, y las reglas son las mismas del cliente porque salen del mismo
 *    módulo (`lib/postulacion-validacion.ts`).
 * 2. **Con la convocatoria cerrada se rechaza.** Si no, el endpoint queda
 *    abierto recibiendo postulaciones que nadie va a mirar.
 * 3. **`persistida` viaja en la respuesta.** En un entorno sin base el envío no
 *    queda registrado, y el formulario tiene que poder decirlo en vez de
 *    mostrar un "listo" que no es cierto.
 */
export async function POST(request: Request) {
  if (!convocatoriaAbierta()) {
    return NextResponse.json(
      { ok: false, mensaje: "En este momento no hay una convocatoria abierta." },
      { status: 409 }
    );
  }

  let datos: unknown;

  try {
    datos = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, mensaje: "El cuerpo de la solicitud no es JSON válido." },
      { status: 400 }
    );
  }

  if (typeof datos !== "object" || datos === null || Array.isArray(datos)) {
    return NextResponse.json(
      { ok: false, mensaje: "Se esperaba un objeto con los datos de la postulación." },
      { status: 400 }
    );
  }

  // Todo lo que llega se trata como texto: un número o un objeto en un campo
  // de texto es un cliente que no es el nuestro.
  const valores: ValoresPostulacion = {};
  for (const [clave, valor] of Object.entries(datos as Record<string, unknown>)) {
    valores[clave] = typeof valor === "string" ? valor : "";
  }

  const errores = validarPostulacion(valores);
  if (Object.keys(errores).length > 0) {
    return NextResponse.json(
      { ok: false, mensaje: "Hay datos que no pasan la validación.", errores },
      { status: 400 }
    );
  }

  const resultado = await guardar(valores);

  if (resultado === "falla") {
    return NextResponse.json(
      { ok: false, mensaje: "No pudimos guardar la postulación. Probá de nuevo en unos minutos." },
      { status: 503 }
    );
  }

  if (resultado === "duplicada") {
    return NextResponse.json(
      {
        ok: false,
        duplicada: true,
        mensaje:
          "Ya recibimos una postulación con ese DNI para esta convocatoria. Si necesitás corregir algo, escribinos."
      },
      { status: 409 }
    );
  }

  return NextResponse.json(
    { ok: true, persistida: resultado === "guardada", mensaje: "Postulación recibida." },
    { status: 200 }
  );
}
