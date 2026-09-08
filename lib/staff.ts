/**
 * Quién puede usar el admin, y para qué.
 *
 * Dos permisos separados a propósito —ver postulaciones es ver datos personales
 * de más de mil personas; cargar una crónica no— y la misma mecánica que el
 * comité: el permiso se resuelve en cada pedido a partir del documento de la
 * sesión firmada, así que sacar la fila de `staff` corta el acceso en el clic
 * siguiente. Nada del rol viaja en la cookie.
 *
 * Sin base configurada cae a `ELCOP_STAFF_PROVISORIO` (documentos separados
 * por coma, con los dos permisos), que existe para desarrollo y para poder
 * auditar las pantallas sin credenciales.
 */
import { normalizarDocumento } from "@/lib/padron";
import { baseDeDatos, falloDeBase } from "@/lib/supabase";

export type PermisosDeStaff = {
  contenido: boolean;
  postulaciones: boolean;
};

/**
 * Los permisos de esta persona, o `null` si no es staff.
 *
 * **Si la base está configurada y no responde, tira** — mismo criterio que el
 * padrón: "no tenés permiso" y "no pudimos comprobarlo" son respuestas
 * distintas, y quien llama decide cómo contarlo.
 */
export async function permisosDeStaff(documento: string): Promise<PermisosDeStaff | null> {
  const normalizado = normalizarDocumento(documento);
  if (!normalizado) return null;

  const base = baseDeDatos();
  if (base) {
    const { data, error } = await base
      .from("staff")
      .select("puede_contenido, puede_postulaciones")
      .eq("documento", normalizado)
      .maybeSingle();

    if (error) falloDeBase("consultar el staff", error);
    if (!data) return null;

    return { contenido: data.puede_contenido, postulaciones: data.puede_postulaciones };
  }

  // Provisorio para desarrollo: quien figura acá tiene los dos permisos.
  const habilitados = (process.env.ELCOP_STAFF_PROVISORIO ?? "")
    .split(",")
    .map((entrada) => normalizarDocumento(entrada))
    .filter((entrada): entrada is string => entrada !== null);

  return habilitados.includes(normalizado) ? { contenido: true, postulaciones: true } : null;
}
