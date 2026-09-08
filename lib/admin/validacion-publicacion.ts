/**
 * Validación de una publicación, compartida entre el formulario y la ruta.
 *
 * Mismo patrón que `validacion-entrega`: el servidor valida siempre (un límite
 * que sólo vive en el navegador no es un límite) y el cliente reusa las mismas
 * reglas para avisar antes de enviar.
 */

export const LIMITES_PUBLICACION = {
  titulo: { minimo: 8, maximo: 120 },
  bajada: { minimo: 30, maximo: 400 },
  categoria: { maximo: 40 },
  imagenAlt: { minimo: 10, maximo: 300 }
} as const;

export type DatosPublicacion = {
  titulo: string;
  bajada: string;
  fecha: string;
  categoria: string;
  imagen: string;
  imagenAlt: string;
};

export type ErroresPublicacion = Partial<Record<keyof DatosPublicacion, string>>;

export function validarPublicacion(datos: DatosPublicacion): ErroresPublicacion {
  const errores: ErroresPublicacion = {};

  const titulo = datos.titulo.trim();
  if (titulo.length < LIMITES_PUBLICACION.titulo.minimo) {
    errores.titulo = `El título necesita al menos ${LIMITES_PUBLICACION.titulo.minimo} caracteres.`;
  } else if (titulo.length > LIMITES_PUBLICACION.titulo.maximo) {
    errores.titulo = `El título no puede superar los ${LIMITES_PUBLICACION.titulo.maximo} caracteres.`;
  }

  const bajada = datos.bajada.trim();
  if (bajada.length < LIMITES_PUBLICACION.bajada.minimo) {
    errores.bajada = `La bajada necesita al menos ${LIMITES_PUBLICACION.bajada.minimo} caracteres.`;
  } else if (bajada.length > LIMITES_PUBLICACION.bajada.maximo) {
    errores.bajada = `La bajada no puede superar los ${LIMITES_PUBLICACION.bajada.maximo} caracteres.`;
  }

  // Solo fecha de calendario (YYYY-MM-DD): la hora no aporta en una crónica.
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datos.fecha) || Number.isNaN(Date.parse(datos.fecha))) {
    errores.fecha = "Elegí una fecha válida.";
  }

  if (datos.categoria.trim() === "") {
    errores.categoria = "Poné una categoría (por ejemplo: Plenario, Novedad).";
  } else if (datos.categoria.trim().length > LIMITES_PUBLICACION.categoria.maximo) {
    errores.categoria = `La categoría no puede superar los ${LIMITES_PUBLICACION.categoria.maximo} caracteres.`;
  }

  if (datos.imagen.trim() === "") {
    errores.imagen = "Subí una imagen de portada.";
  }

  // El alt no es opcional: sin él, la foto no existe para quien no la ve.
  const alt = datos.imagenAlt.trim();
  if (alt.length < LIMITES_PUBLICACION.imagenAlt.minimo) {
    errores.imagenAlt = `Describí la imagen en al menos ${LIMITES_PUBLICACION.imagenAlt.minimo} caracteres: es lo que escucha quien usa lector de pantalla.`;
  } else if (alt.length > LIMITES_PUBLICACION.imagenAlt.maximo) {
    errores.imagenAlt = `La descripción no puede superar los ${LIMITES_PUBLICACION.imagenAlt.maximo} caracteres.`;
  }

  return errores;
}

export function hayErrores(errores: ErroresPublicacion): boolean {
  return Object.values(errores).some(Boolean);
}

/**
 * El slug sale del título una sola vez, al crear: es la URL estable de la
 * nota, y cambiarlo después rompería enlaces ya compartidos.
 */
export function slugDesdeTitulo(titulo: string): string {
  return titulo
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
