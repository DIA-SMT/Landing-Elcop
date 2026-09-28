/**
 * Quién puede usar el admin, y para qué.
 *
 * Dos permisos separados a propósito —ver postulaciones es ver datos personales
 * de más de mil personas; cargar una crónica no— y una mecánica que no cambió
 * al pasar a usuarios de Supabase: el permiso se resuelve en cada pedido a
 * partir de la sesión, así que sacar la fila de `staff` corta el acceso en el
 * clic siguiente. Nada del rol viaja en el token.
 *
 * **La clave es el usuario de Supabase, no el documento** (migración 0004). El
 * admin dejó de entrar con Ciudadano Digital; el portal y `/comite` siguen con
 * CIDITUC y siguen usando documentos.
 *
 * Sin base configurada cae a `ELCOP_STAFF_PROVISORIO`, que ahora lista ids de
 * usuario separados por coma. Existe para desarrollo y para poder auditar las
 * pantallas sin una base detrás.
 */
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
export async function permisosDeStaff(usuarioId: string): Promise<PermisosDeStaff | null> {
  const id = usuarioId?.trim();
  if (!id) return null;

  const base = baseDeDatos();
  if (base) {
    const { data, error } = await base
      .from("staff")
      .select("puede_contenido, puede_postulaciones")
      .eq("usuario_id", id)
      .maybeSingle();

    if (error) falloDeBase("consultar el staff", error);
    if (!data) return null;

    return { contenido: data.puede_contenido, postulaciones: data.puede_postulaciones };
  }

  // Provisorio para desarrollo: quien figura acá tiene los dos permisos.
  const habilitados = (process.env.ELCOP_STAFF_PROVISORIO ?? "")
    .split(",")
    .map((entrada) => entrada.trim())
    .filter(Boolean);

  return habilitados.includes(id) ? { contenido: true, postulaciones: true } : null;
}
