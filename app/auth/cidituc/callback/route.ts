import { NextResponse } from "next/server";

import { COOKIE_SESION, DURACION_SESION_SEGUNDOS, firmarSesion, verificarTokenCidituc } from "@/lib/cidituc";
import { obtenerPerfil } from "@/lib/cidituc-perfil";
import { buscarBecarioPorDocumento, normalizarDocumento } from "@/lib/padron";

/**
 * Vuelta desde CIDITUC: `/auth/cidituc/callback?auth=<token>&ruta=<destino>`
 *
 * Cuatro pasos, y ninguno se puede saltear:
 *
 *   1. Verificar la firma del token.
 *   2. Traer el documento de la persona del backend de CIDITUC.
 *   3. Comprobar que ese documento esté en el padrón de becarios.
 *   4. Emitir nuestra cookie de sesión.
 *
 * El paso 3 es el que separa autenticar de autorizar. Sin él, cualquier vecino
 * con cuenta de CIDITUC entraría al portal.
 *
 * Se responde con una redirección en todos los casos, con el motivo en la
 * query. **El token nunca sobrevive a este handler**: la URL a la que
 * redirigimos ya no lo lleva, así que no queda en la barra de direcciones ni en
 * el historial de la persona.
 */

/** Vuelve al portal con un motivo, sin filtrar detalles internos. */
function rechazar(origen: string, motivo: string): NextResponse {
  return NextResponse.redirect(`${origen}/portal?error=${motivo}`);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origen = url.origin;

  const token = url.searchParams.get("auth");
  if (!token) return rechazar(origen, "sin-token");

  // 1. La firma. No hace falta llamar a nadie: el secreto es compartido.
  const identidad = await verificarTokenCidituc(token);
  if (!identidad) return rechazar(origen, "token-invalido");

  // 2. El documento. El token sólo trae el id, así que hay que preguntarlo.
  const perfil = await obtenerPerfil(token);
  if (!perfil) return rechazar(origen, "sin-perfil");

  // Que el perfil corresponda al token y no a otra persona.
  if (perfil.idPersona !== identidad.idPersona) return rechazar(origen, "perfil-no-coincide");

  const documento = normalizarDocumento(perfil.documento);
  if (!documento) return rechazar(origen, "documento-invalido");

  // 3. El padrón. Acá se cae quien no es becario.
  const becario = await buscarBecarioPorDocumento(documento);
  if (!becario) return rechazar(origen, "no-es-becario");

  // 4. Nuestra sesión. No se guarda el token de CIDITUC: ya cumplió su función
  // y conservarlo sólo ampliaría lo que se pierde si la cookie se filtra.
  const nombreCompleto = [perfil.nombre, perfil.apellido].filter(Boolean).join(" ").trim();
  const sesion = await firmarSesion({
    idPersona: identidad.idPersona,
    documento,
    nombre: nombreCompleto || becario.nombre,
    becarioId: becario.id
  });

  const rutaPedida = url.searchParams.get("ruta");
  // Sólo rutas internas: una URL completa acá permitiría que un enlace armado
  // por otro nos use para redirigir a un sitio ajeno.
  const destino = rutaPedida && rutaPedida.startsWith("/") && !rutaPedida.startsWith("//")
    ? rutaPedida
    : "/portal";

  const respuesta = NextResponse.redirect(`${origen}${destino}`);
  respuesta.cookies.set(COOKIE_SESION, sesion, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DURACION_SESION_SEGUNDOS
  });

  return respuesta;
}
