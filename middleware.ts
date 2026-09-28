import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

import { cookieEndurecida } from "@/lib/admin/cookies";

/**
 * Renovación de la sesión del admin.
 *
 * El token de acceso de Supabase dura una hora. Sin esto, a la hora de trabajo
 * el panel empezaría a mandar al ingreso en medio de una carga. El middleware
 * toca `getUser()` en cada pedido, que refresca el token cuando hace falta y
 * reescribe las cookies.
 *
 * **Sólo corre en `/admin`.** El Portal del Becario y `/comite` entran con
 * Ciudadano Digital y su cookie la firma y verifica `lib/cidituc.ts`: no tienen
 * nada que renovar acá, y hacerlos pasar por este middleware sería gastar un
 * pedido a Supabase en cada visita de un becario.
 *
 * Esto NO autoriza: sólo mantiene viva la sesión. Quién puede ver qué lo
 * deciden las páginas con `sesionDeAdmin()`, contra la tabla `staff`.
 */
export async function middleware(request: NextRequest) {
  let respuesta = NextResponse.next({ request: { headers: request.headers } });

  const url = process.env.SUPABASE_URL;
  const clave = process.env.SUPABASE_PUBLISHABLE_KEY;
  // Sin configuración no hay nada que renovar: el guardián de cada página se
  // encarga de contar que el ingreso no está disponible.
  if (!url || !clave) return respuesta;

  const cliente = createServerClient(url, clave, {
    cookies: {
      get: (nombre: string) => request.cookies.get(nombre)?.value,
      set: (nombre: string, valor: string, opciones: CookieOptions) => {
        request.cookies.set({ name: nombre, value: valor, ...opciones });
        respuesta = NextResponse.next({ request: { headers: request.headers } });
        respuesta.cookies.set({ name: nombre, value: valor, ...cookieEndurecida(opciones) });
      },
      remove: (nombre: string, opciones: CookieOptions) => {
        request.cookies.set({ name: nombre, value: "", ...opciones });
        respuesta = NextResponse.next({ request: { headers: request.headers } });
        respuesta.cookies.set({ name: nombre, value: "", ...cookieEndurecida(opciones), maxAge: 0 });
      }
    }
  });

  await cliente.auth.getUser();

  return respuesta;
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"]
};
