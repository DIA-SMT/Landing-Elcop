import { NextResponse } from "next/server";

import { registrar } from "@/lib/interesados";

/**
 * Registro de quienes quieren enterarse cuando abra la próxima convocatoria.
 *
 * Valida acá y no sólo en el cliente, por lo mismo que la postulación. Las
 * reglas son más flojas a propósito: es un mail para avisar algo, no una
 * declaración de datos.
 */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

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
    return NextResponse.json({ ok: false, mensaje: "Se esperaba un objeto." }, { status: 400 });
  }

  const cuerpo = datos as Record<string, unknown>;
  const texto = (clave: string) => (typeof cuerpo[clave] === "string" ? (cuerpo[clave] as string).trim() : "");

  const nombre = texto("nombre");
  const email = texto("email");
  const telefono = texto("telefono");

  const errores: Record<string, string> = {};
  if (nombre.length < 3) errores.nombre = "Escribí tu nombre y apellido.";
  if (!EMAIL.test(email)) errores.email = "Revisá el email: falta el @ o el dominio.";
  // El teléfono es opcional, pero si lo dejan tiene que servir para llamar.
  if (telefono && telefono.replace(/\D/g, "").length < 8) {
    errores.telefono = "Ingresá el teléfono con característica, sin el 0 ni el 15.";
  }

  if (Object.keys(errores).length > 0) {
    return NextResponse.json(
      { ok: false, mensaje: "Hay datos que no pasan la validación.", errores },
      { status: 400 }
    );
  }

  const resultado = await registrar({ nombre, email, telefono: telefono || undefined });

  if (resultado === "falla") {
    return NextResponse.json(
      { ok: false, mensaje: "No pudimos guardar tus datos. Probá de nuevo en unos minutos." },
      { status: 503 }
    );
  }

  return NextResponse.json(
    { ok: true, persistido: resultado !== "sin-base", mensaje: "Registro recibido." },
    { status: 200 }
  );
}
