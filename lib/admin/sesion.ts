/**
 * La sesión del admin, con usuarios de Supabase.
 *
 * **Por qué esto es distinto del resto del proyecto.** El Portal del Becario y
 * `/comite` entran con Ciudadano Digital (`lib/cidituc.ts`) y así se quedan: la
 * identidad de mil postulantes y ochenta becarios la pone el Estado, no
 * nosotros. El admin son cinco o seis personas de coordinación, y hacer que
 * cada alta dependa de un trámite con DITEC costaba más de lo que valía.
 *
 * **El navegador sigue sin hablar con Supabase.** El ingreso ocurre en una ruta
 * nuestra (`/api/admin/ingreso`), que llama a Supabase desde el servidor; lo
 * único que llega al navegador son las cookies que escribimos nosotros. Por eso
 * la clave publicable NO lleva el prefijo `NEXT_PUBLIC_`: nunca se sirve al
 * cliente, y no tiene por qué estar ahí.
 *
 * **El permiso no viaja en el token.** `getUser()` dice quién es; los permisos
 * se resuelven contra la tabla `staff` en cada pedido, igual que antes. Sacar
 * la fila corta el acceso en el clic siguiente.
 */
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { SupabaseClient, User } from "@supabase/supabase-js";

import { cookieEndurecida } from "@/lib/admin/cookies";
import { permisosDeStaff, type PermisosDeStaff } from "@/lib/staff";

export type SesionAdmin = { usuario: User; permisos: PermisosDeStaff };

/** Dónde manda el guardián cuando no hay sesión. */
export const RUTA_INGRESO = "/admin/ingreso";

function configuracion() {
  const url = process.env.SUPABASE_URL;
  const clave = process.env.SUPABASE_PUBLISHABLE_KEY;
  return url && clave ? { url, clave } : null;
}


/** `true` si el ingreso del admin está configurado. */
export function authConfigurada(): boolean {
  return configuracion() !== null;
}

/**
 * Cliente de auth atado a las cookies del pedido.
 *
 * `escribible` distingue los dos contextos de Next: en una ruta de API o en una
 * Server Action se pueden escribir cookies, en un Server Component no. Intentar
 * escribirlas desde un componente tira, así que ahí las escrituras se ignoran a
 * propósito y la renovación del token la hace el middleware.
 */
export function clienteDeAuth({ escribible = false } = {}): SupabaseClient | null {
  const config = configuracion();
  if (!config) return null;

  const almacen = cookies();

  return createServerClient(config.url, config.clave, {
    cookies: {
      get: (nombre: string) => almacen.get(nombre)?.value,
      set: (nombre: string, valor: string, opciones: CookieOptions) => {
        if (!escribible) return;
        almacen.set({ name: nombre, value: valor, ...cookieEndurecida(opciones) });
      },
      remove: (nombre: string, opciones: CookieOptions) => {
        if (!escribible) return;
        almacen.set({ name: nombre, value: "", ...cookieEndurecida(opciones), maxAge: 0 });
      }
    }
  });
}

/**
 * Quién entró y qué puede hacer, o `null`.
 *
 * Devuelve `null` tanto para "no hay sesión" como para "hay sesión pero no es
 * staff". Quien llama decide qué hacer con cada caso: las páginas mandan al
 * ingreso si no hay usuario y responden 404 si lo hay pero no tiene permisos,
 * que es el mismo criterio de `/comite` —a quien no le corresponde, la ruta ni
 * le confirma que existe.
 */
export async function sesionDeAdmin(): Promise<SesionAdmin | null> {
  const cliente = clienteDeAuth();
  if (!cliente) return null;

  // `getUser()` y no `getSession()`: el primero valida el token contra Supabase,
  // el segundo se cree lo que diga la cookie.
  const { data, error } = await cliente.auth.getUser();
  if (error || !data.user) return null;

  const permisos = await permisosDeStaff(data.user.id).catch(() => null);
  if (!permisos) return null;

  return { usuario: data.user, permisos };
}

/** `true` si hay usuario aunque no sea staff: sirve para distinguir 404 de ingreso. */
export async function hayUsuario(): Promise<boolean> {
  const cliente = clienteDeAuth();
  if (!cliente) return false;
  const { data } = await cliente.auth.getUser();
  return Boolean(data.user);
}

/**
 * El guardián de las páginas del admin. Devuelve la sesión o no devuelve nada.
 *
 * Distingue los dos "no" a propósito, y es la misma regla que tenía el admin
 * con CIDITUC:
 *
 * - **Sin sesión → al ingreso.** No sabemos quién es; puede ser alguien del
 *   equipo que todavía no entró.
 * - **Con sesión pero sin el permiso → 404.** Ya sabemos quién es y no le
 *   corresponde: la ruta ni le confirma que existe. Un 403 le avisaría que hay
 *   un panel ahí y que sólo le falta el permiso.
 */
export async function exigirAdmin(permiso: keyof PermisosDeStaff): Promise<SesionAdmin> {
  const sesion = await sesionDeAdmin();
  if (sesion?.permisos[permiso]) return sesion;

  // Sólo para páginas: las dos funciones cortan el render lanzando. Las rutas
  // de API no lo usan —tienen que responder JSON— y llaman a `sesionDeAdmin()`.
  if (await hayUsuario()) notFound();
  redirect(RUTA_INGRESO);
}
