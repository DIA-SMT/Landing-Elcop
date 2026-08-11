/**
 * Quién puede ver las entregas de toda la cohorte.
 *
 * El portal tiene una sola clase de usuario —el becario, y todo lo que ve es
 * suyo— más esta excepción: el comité académico, que lee los proyectos de los
 * demás.
 *
 * ## Por qué esto no va en la cookie
 *
 * Sería más rápido resolverlo al ingresar y guardarlo en la sesión firmada, pero
 * entonces sacarle el permiso a alguien no tendría efecto hasta que su cookie
 * venciera —un día—. Se resuelve en cada pedido a partir del documento de la
 * sesión, que sí está firmado. El rol vive en la tabla `comite`: sacar la fila
 * corta el acceso en el próximo pedido.
 *
 * Sin base configurada cae a `ELCOP_COMITE_PROVISORIO`, para desarrollo.
 */
import { normalizarDocumento } from "@/lib/padron";
import { baseDeDatos, falloDeBase } from "@/lib/supabase";

/**
 * ¿Esta persona puede ver las entregas de todos?
 *
 * Es la única pregunta que hacen las rutas del comité, y por eso es la única
 * función que exporta este módulo. Si mañana hace falta distinguir la dirección
 * del comité, se agrega ahí: hoy nadie lo necesita y un rol sin usuarios es una
 * rama que nunca se prueba.
 *
 * **Si la base está configurada y no responde, tira** en vez de devolver
 * `false`: "no tenés permiso" y "no pudimos comprobarlo" son respuestas
 * distintas, y confundirlas manda a la gente a pelear con la puerta equivocada.
 */
export async function esComite(documento: string): Promise<boolean> {
  const normalizado = normalizarDocumento(documento);
  if (!normalizado) return false;

  const base = baseDeDatos();
  if (base) {
    const { data, error } = await base
      .from("comite")
      .select("documento")
      .eq("documento", normalizado)
      .maybeSingle();

    if (error) falloDeBase("consultar el comité", error);
    return data !== null;
  }

  // Provisorio, para desarrollo sin base.
  return (process.env.ELCOP_COMITE_PROVISORIO ?? "")
    .split(",")
    .map((entrada) => normalizarDocumento(entrada))
    .includes(normalizado);
}
