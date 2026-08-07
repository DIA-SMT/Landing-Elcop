/**
 * Lectura de la sesión desde el servidor.
 *
 * Es lo que usan las páginas del portal para saber quién entró. Devuelve `null`
 * si no hay sesión válida, y con eso alcanza: la página decide si muestra el
 * botón de ingreso o el contenido.
 */
import { cookies } from "next/headers";

import { COOKIE_SESION, verificarSesion, type SesionElcop } from "@/lib/cidituc";

export async function obtenerSesion(): Promise<SesionElcop | null> {
  return verificarSesion(cookies().get(COOKIE_SESION)?.value);
}

export type { SesionElcop };
