import { NextResponse } from "next/server";

import { COOKIE_SESION } from "@/lib/cidituc";

/**
 * Cierre de sesión.
 *
 * Es POST y no GET a propósito: con GET, cualquier imagen o enlace en otro
 * sitio podría cerrarle la sesión a la persona sin que lo pida.
 *
 * Cierra sólo la sesión de este portal. La de CIDITUC sigue abierta en su
 * dominio, que es lo esperable: cerrar sesión en ELCOP no debería desloguear a
 * alguien de todos los servicios del municipio.
 */
export async function POST(request: Request) {
  const respuesta = NextResponse.redirect(new URL("/portal", request.url), {
    // 303 para que el navegador cambie el POST por un GET al redirigir.
    status: 303
  });
  respuesta.cookies.set(COOKIE_SESION, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0
  });
  return respuesta;
}
