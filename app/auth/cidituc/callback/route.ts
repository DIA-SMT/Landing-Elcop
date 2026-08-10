import { NextResponse } from "next/server";

import { COOKIE_SESION, DURACION_SESION_SEGUNDOS, firmarSesion, pareceUnToken } from "@/lib/cidituc";
import { obtenerPerfil } from "@/lib/cidituc-perfil";
import { buscarBecarioPorDocumento, normalizarDocumento } from "@/lib/padron";
import { rolDe } from "@/lib/portal/roles";

/**
 * Vuelta desde CIDITUC: `/auth/cidituc/callback?auth=<token>`
 *
 * Tres pasos, y ninguno se puede saltear:
 *
 *   1. Pedirle el perfil al backend de CIDITUC con ese token. Esa llamada
 *      valida la firma del lado de ellos y devuelve el documento: si el token
 *      es falso o venció, no responde con una persona.
 *   2. Comprobar que ese documento esté en el padrón de becarios.
 *   3. Emitir nuestra cookie de sesión.
 *
 * El paso 2 es el que separa autenticar de autorizar. Sin él, cualquier vecino
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
  // Filtro barato: evita salir a la red por cada cadena pegada a mano.
  if (!pareceUnToken(token)) return rechazar(origen, "token-invalido");

  // 1. El perfil. Esta llamada es la que valida el token: el backend de CIDITUC
  // verifica la firma antes de responder, así que un token falso o vencido no
  // devuelve una persona.
  const perfil = await obtenerPerfil(token);
  if (!perfil) return rechazar(origen, "sin-perfil");

  const documento = normalizarDocumento(perfil.documento);
  if (!documento) return rechazar(origen, "documento-invalido");

  // 2. La autorización. Acá se cae quien no tiene nada que hacer en el portal.
  //
  // Dos puertas y no una: el padrón de becarios, y los roles elevados. El comité
  // académico y la dirección **no son becarios**, así que si el padrón fuera la
  // única condición, la gente que evalúa no podría ni entrar.
  const becario = await buscarBecarioPorDocumento(documento);
  const rol = rolDe(documento);
  if (!becario && !rol) return rechazar(origen, "no-es-becario");

  // 3. Nuestra sesión. No se guarda el token de CIDITUC: ya cumplió su función
  // y conservarlo sólo ampliaría lo que se pierde si la cookie se filtra.
  const nombreCompleto = [perfil.nombre, perfil.apellido].filter(Boolean).join(" ").trim();
  const sesion = await firmarSesion({
    idPersona: perfil.idPersona,
    documento,
    nombre: nombreCompleto || becario?.nombre || "",
    // Quien no es becario no tiene entrega propia: su documento sirve de
    // identificador y el portal del becario le va a aparecer vacío, que es la
    // verdad. El rol no se guarda acá; se resuelve en cada pedido (ver
    // `lib/portal/roles.ts`).
    becarioId: becario?.id ?? documento
  });

  const respuesta = NextResponse.redirect(`${origen}/portal`);
  respuesta.cookies.set(COOKIE_SESION, sesion, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DURACION_SESION_SEGUNDOS
  });

  return respuesta;
}
