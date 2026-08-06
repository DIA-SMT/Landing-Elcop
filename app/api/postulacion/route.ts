import { NextResponse } from "next/server";

/**
 * Recepción de postulaciones.
 *
 * ESTADO ACTUAL: no persiste nada. Valida que el cuerpo sea un objeto, loguea
 * en el servidor y devuelve 200. Es un tapón deliberado para poder maquetar y
 * probar el formulario sin comprometerse todavía con un destino.
 *
 * TODO: confirmar con ELCOP cuál es el destino real de las postulaciones
 * (Google Sheets, un mail institucional, una base propia o el sistema de la
 * UNSTA). Cuando se defina, reemplazar el cuerpo de `guardarPostulacion` y
 * dejar el resto del handler como está.
 */

type Postulacion = Record<string, unknown>;

/**
 * Único punto de contacto con el destino final. Está aislado a propósito:
 * enchufar el destino real debería ser cambiar sólo esta función.
 */
async function guardarPostulacion(datos: Postulacion): Promise<void> {
  // No logueamos el cuerpo completo: son datos personales (DNI, teléfono,
  // fecha de nacimiento) y no tienen por qué quedar en los logs del servidor.
  console.info("[postulacion] recibida", {
    campos: Object.keys(datos).length,
    recibidaEn: new Date().toISOString()
  });
}

export async function POST(request: Request) {
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

  await guardarPostulacion(datos as Postulacion);

  return NextResponse.json({ ok: true, mensaje: "Postulación recibida." }, { status: 200 });
}
