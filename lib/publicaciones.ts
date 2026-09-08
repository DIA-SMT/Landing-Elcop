/**
 * De dónde salen las publicaciones.
 *
 * Con la base configurada, de la tabla `publicaciones`, que edita la
 * coordinación desde /admin/contenido. Sin base —desarrollo sin credenciales—
 * cae al arreglo de `content/elcop.ts`, que quedó como semilla y respaldo.
 *
 * **El visitante solo ve lo publicado.** Los borradores no salen de acá: la
 * regla de "nada provisorio como oficial" se aplica en la consulta, no en la
 * pantalla, así ninguna pantalla nueva puede olvidarse de filtrar.
 */
import { PUBLICACIONES, type Publicacion } from "@/content/elcop";
import { baseDeDatos, falloDeBase } from "@/lib/supabase";

/** La forma de la tabla; `estado` no viaja al visitante. */
type FilaPublicacion = {
  slug: string;
  titulo: string;
  bajada: string;
  fecha: string;
  categoria: string;
  imagen: string;
  imagen_alt: string;
  estado: "borrador" | "publicada";
};

function desdeFila(fila: FilaPublicacion): Publicacion {
  return {
    slug: fila.slug,
    titulo: fila.titulo,
    bajada: fila.bajada,
    fecha: fila.fecha,
    categoria: fila.categoria,
    imagen: fila.imagen,
    imagenAlt: fila.imagen_alt,
    // Lo que sale de la base nunca es de ejemplo: lo cargó una persona real.
    esEjemplo: false
  };
}

/** Lo que ve el visitante: publicadas, de la más nueva a la más vieja. */
export async function publicacionesPublicadas(): Promise<Publicacion[]> {
  const base = baseDeDatos();
  if (!base) return PUBLICACIONES;

  const { data, error } = await base
    .from("publicaciones")
    .select("*")
    .eq("estado", "publicada")
    .order("fecha", { ascending: false });

  if (error) falloDeBase("leer las publicaciones", error);
  return ((data ?? []) as FilaPublicacion[]).map(desdeFila);
}

/** Todo, también borradores: SOLO para el admin. Quien llama verificó el rol. */
export async function publicacionesParaAdmin(): Promise<(Publicacion & { estado: string })[]> {
  const base = baseDeDatos();
  if (!base) return PUBLICACIONES.map((publicacion) => ({ ...publicacion, estado: "publicada" }));

  const { data, error } = await base
    .from("publicaciones")
    .select("*")
    .order("fecha", { ascending: false });

  if (error) falloDeBase("leer las publicaciones del admin", error);
  return ((data ?? []) as FilaPublicacion[]).map((fila) => ({ ...desdeFila(fila), estado: fila.estado }));
}
