import { NextResponse } from "next/server";

import { RUTA_INGRESO, clienteDeAuth } from "@/lib/admin/sesion";

/**
 * Cierre de sesión del admin.
 *
 * Es POST y no GET a propósito: una salida por GET la dispara cualquier imagen
 * o enlace ajeno y deja a la persona afuera sin haber pedido nada. El botón de
 * `MarcoAdmin` es un formulario por eso.
 */
export async function POST(request: Request) {
  const cliente = clienteDeAuth({ escribible: true });
  // `scope: "local"` borra la sesión de este navegador y no todas las de la
  // persona: cerrar sesión en la oficina no tiene por qué echarla del celular.
  await cliente?.auth.signOut({ scope: "local" });

  return NextResponse.redirect(new URL(RUTA_INGRESO, request.url), { status: 303 });
}
