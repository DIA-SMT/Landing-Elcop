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
 * sesión, que sí está firmado: hoy es leer una variable de entorno y mañana una
 * consulta a la base.
 *
 * ⚠️ **Implementación provisoria**, igual que `lib/padron.ts`: el comité sale de
 * una variable de entorno. Cuando exista la base se reemplaza el cuerpo de
 * `esComite` y nada más.
 */
import { normalizarDocumento } from "@/lib/padron";

/**
 * ¿Esta persona puede ver las entregas de todos?
 *
 * Es la única pregunta que hacen las rutas del comité, y por eso es la única
 * función que exporta este módulo. Si mañana hace falta distinguir la dirección
 * del comité, se agrega ahí: hoy nadie lo necesita y un rol sin usuarios es una
 * rama que nunca se prueba.
 */
export function esComite(documento: string): boolean {
  const normalizado = normalizarDocumento(documento);
  if (!normalizado) return false;

  return (process.env.ELCOP_COMITE_PROVISORIO ?? "")
    .split(",")
    .map((entrada) => normalizarDocumento(entrada))
    .includes(normalizado);
}
