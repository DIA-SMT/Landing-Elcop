/**
 * El cliente de la base de datos. **Sólo para el servidor.**
 *
 * El navegador nunca habla con Supabase: todo pasa por nuestras rutas, que ya
 * saben quién es la persona por nuestra cookie. Por eso acá se usa la clave
 * secreta —que puentea el RLS— y por eso esa clave jamás lleva `NEXT_PUBLIC_`:
 * expuesta en el cliente, cualquiera lee el padrón entero. Es el mismo
 * razonamiento que la clave de OpenRouter, pero acá se paga con datos de
 * personas en vez de plata.
 *
 * Devuelve `null` cuando las variables no están configuradas. Los módulos que
 * consultan (padrón, roles, datos del portal) caen entonces a su implementación
 * provisoria por variables de entorno, así el proyecto sigue andando en un
 * entorno de desarrollo sin base.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cliente: SupabaseClient | null | undefined;

export function baseDeDatos(): SupabaseClient | null {
  if (cliente !== undefined) return cliente;

  const url = process.env.SUPABASE_URL;
  const clave = process.env.SUPABASE_SECRET_KEY;

  cliente =
    url && clave
      ? createClient(url, clave, {
          // Sin sesión de Supabase Auth: la autenticación es nuestra (CIDITUC +
          // cookie propia). Esto es un cliente de datos, nada más.
          auth: { persistSession: false, autoRefreshToken: false }
        })
      : null;

  return cliente;
}

/**
 * Convierte un error de la base en una excepción con contexto.
 *
 * Existe para que "la base no respondió" nunca se confunda con "no existe ese
 * dato": el primero es una falla nuestra que se registra y se le cuenta a la
 * persona como indisponibilidad; el segundo es una respuesta válida.
 * El mensaje nunca incluye valores de las filas: sólo la operación y el código.
 */
export function falloDeBase(operacion: string, error: { message: string; code?: string }): never {
  console.warn(`[base] ${operacion} falló — ${error.code ?? "?"}: ${error.message}`);
  throw new Error(`No se pudo ${operacion}.`);
}
