import type { CookieOptions } from "@supabase/ssr";

/**
 * Endurece las cookies de sesión del admin.
 *
 * `@supabase/ssr` NO pone `httpOnly` por defecto, porque su caso habitual es un
 * cliente de Supabase corriendo en el navegador, que necesita leerlas. Acá no
 * existe ese cliente: el ingreso y la lectura de la sesión pasan siempre por el
 * servidor. Dejarlas legibles por JavaScript sería regalar la sesión del admin
 * ante cualquier XSS, y la cookie de CIDITUC del proyecto ya es `httpOnly`.
 *
 * `secure` sólo en producción: en desarrollo el sitio es http y el navegador
 * descartaría una cookie marcada como segura.
 *
 * **Vive en su propio módulo, sin importar nada de Next.** Lo usa el middleware,
 * que corre en el runtime Edge: si estuviera en `lib/admin/sesion.ts` arrastraría
 * `next/headers` y `next/navigation`, que ahí no existen.
 */
export function cookieEndurecida(opciones: CookieOptions): CookieOptions {
  return {
    ...opciones,
    httpOnly: true,
    sameSite: opciones.sameSite ?? "lax",
    secure: process.env.NODE_ENV === "production"
  };
}
