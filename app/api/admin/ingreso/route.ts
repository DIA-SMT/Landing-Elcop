import { NextResponse } from "next/server";

import { authConfigurada, clienteDeAuth } from "@/lib/admin/sesion";

/**
 * Ingreso al admin con usuario y contraseña de Supabase.
 *
 * Dos decisiones que conviene defender:
 *
 * 1. **La contraseña no pasa por el navegador hacia Supabase.** El formulario la
 *    manda acá y este servidor habla con Supabase. Lo único que vuelve al
 *    navegador son cookies que escribimos nosotros, así que la propiedad de que
 *    "el navegador no habla con Supabase" se conserva.
 * 2. **Acá sólo se autentica, no se autoriza.** Si la persona existe pero no
 *    está en `staff`, entra y las pantallas le responden 404, igual que antes.
 *    Mezclar las dos cosas convertiría este endpoint en un oráculo que dice
 *    quién es staff a cualquiera que pruebe una contraseña.
 *
 * El registro abierto tiene que estar deshabilitado en Supabase: este endpoint
 * no crea usuarios y no debería haber otra forma de crearlos que la invitación
 * desde el panel.
 */
export async function POST(request: Request) {
  if (!authConfigurada()) {
    return NextResponse.json(
      { ok: false, mensaje: "El ingreso al panel no está configurado en este entorno." },
      { status: 503 }
    );
  }

  let datos: unknown;
  try {
    datos = await request.json();
  } catch {
    return NextResponse.json({ ok: false, mensaje: "El cuerpo no es JSON válido." }, { status: 400 });
  }
  if (typeof datos !== "object" || datos === null) {
    return NextResponse.json({ ok: false, mensaje: "Se esperaba un objeto." }, { status: 400 });
  }

  const cuerpo = datos as Record<string, unknown>;
  const email = typeof cuerpo.email === "string" ? cuerpo.email.trim().toLowerCase() : "";
  const contrasena = typeof cuerpo.contrasena === "string" ? cuerpo.contrasena : "";

  const errores: Record<string, string> = {};
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) errores.email = "Revisá el email.";
  if (contrasena.length < 1) errores.contrasena = "Escribí tu contraseña.";
  if (Object.keys(errores).length > 0) {
    return NextResponse.json({ ok: false, errores }, { status: 400 });
  }

  const cliente = clienteDeAuth({ escribible: true })!;
  const { error } = await cliente.auth.signInWithPassword({ email, password: contrasena });

  if (error) {
    // Un solo mensaje para "no existe" y "contraseña equivocada": distinguirlos
    // le confirma a cualquiera qué direcciones tienen cuenta.
    console.warn(`[admin] ingreso rechazado — ${error.status ?? "?"}: ${error.message}`);
    return NextResponse.json(
      { ok: false, mensaje: "El email o la contraseña no coinciden." },
      { status: 401 }
    );
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
