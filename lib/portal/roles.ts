/**
 * Quién puede hacer qué en el portal.
 *
 * Hasta ahora el portal tenía una sola clase de usuario: el becario, y todo lo
 * que veía era suyo. La vista del comité rompe eso —muestra los proyectos de
 * otras personas—, así que hace falta distinguir roles.
 *
 * ## Por qué el rol NO va en la cookie
 *
 * Sería más rápido meterlo en la sesión firmada al ingresar, pero trae dos
 * problemas que no valen el ahorro:
 *
 * 1. **Sacarle el permiso a alguien no tendría efecto** hasta que su cookie
 *    venza. Un día entero, con la configuración actual.
 * 2. **Las cookies viejas no lo traen.** Una sesión emitida antes de este cambio
 *    no tiene rol, y cualquier valor por omisión que eligiéramos sería una
 *    decisión de seguridad tomada por descuido.
 *
 * Se resuelve en cada pedido a partir del documento de la sesión, que sí está
 * firmado. Es una lectura de variable de entorno hoy y una consulta a la base
 * después: nada que justifique cachearlo en el navegador.
 *
 * ⚠️ **Implementación provisoria**, igual que `lib/padron.ts`: el comité sale de
 * una variable de entorno. Cuando exista la base, se reemplaza el cuerpo de
 * `rolDe` y nada más.
 */
import { normalizarDocumento } from "@/lib/padron";

/**
 * Los roles del portal, tomados de `ESQUEMA.md` §4.2.
 *
 * `becario` no está acá porque es lo que se asume: quien pasó el padrón y no
 * tiene ningún rol extra. Nombrarlo invitaría a escribir `rol === "becario"`
 * como si fuera una credencial, cuando es la ausencia de una.
 */
export type RolElevado = "comite" | "admin";

/** Lee una lista de documentos de una variable de entorno. */
function documentosDe(variable: string | undefined): string[] {
  return (variable ?? "")
    .split(",")
    .map((entrada) => normalizarDocumento(entrada))
    .filter((entrada): entrada is string => entrada !== null);
}

/**
 * El rol elevado de una persona, o `null` si es un becario común.
 *
 * `admin` incluye lo del comité: la dirección puede ver lo que ve el comité, y
 * mantener dos listas donde la de arriba tiene que repetir a la de abajo es la
 * receta para que se desincronicen.
 */
export function rolDe(documento: string): RolElevado | null {
  const normalizado = normalizarDocumento(documento);
  if (!normalizado) return null;

  if (documentosDe(process.env.ELCOP_ADMIN_PROVISORIO).includes(normalizado)) return "admin";
  if (documentosDe(process.env.ELCOP_COMITE_PROVISORIO).includes(normalizado)) return "comite";
  return null;
}

/**
 * ¿Esta persona puede ver las entregas de todos?
 *
 * Es la única pregunta que hacen las rutas del comité, y está acá para que la
 * respuesta viva en un solo lugar. Si mañana se suma un rol que también puede,
 * se cambia esta función y no cinco `if` repartidos.
 */
export function puedeVerTodasLasEntregas(documento: string): boolean {
  const rol = rolDe(documento);
  return rol === "comite" || rol === "admin";
}
