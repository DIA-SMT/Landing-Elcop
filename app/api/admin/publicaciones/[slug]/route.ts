import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import {
  hayErrores,
  validarPublicacion,
  type DatosPublicacion
} from "@/lib/admin/validacion-publicacion";
import { permisosDeStaff } from "@/lib/staff";
import { obtenerSesion } from "@/lib/sesion";
import { baseDeDatos } from "@/lib/supabase";

/**
 * Edición, publicación y borrado de UNA publicación.
 *
 * El slug no se edita nunca: es la URL estable de la nota. Publicar y volver a
 * borrador son cambios de `estado` por esta misma ruta.
 */

async function autorizar(): Promise<NextResponse | null> {
  const sesion = await obtenerSesion();
  if (!sesion) return NextResponse.json({ ok: false, mensaje: "Iniciá sesión." }, { status: 401 });

  const permisos = await permisosDeStaff(sesion.documento).catch(() => null);
  if (!permisos?.contenido) {
    return NextResponse.json({ ok: false, mensaje: "No encontrado." }, { status: 404 });
  }
  return null;
}

function revalidarPublicaciones(): void {
  revalidatePath("/publicaciones");
}

/** Actualiza datos y/o estado. */
export async function PATCH(request: Request, { params }: { params: { slug: string } }) {
  const rechazo = await autorizar();
  if (rechazo) return rechazo;

  const base = baseDeDatos();
  if (!base) {
    return NextResponse.json(
      { ok: false, mensaje: "El admin necesita la base de datos configurada." },
      { status: 503 }
    );
  }

  const cuerpo = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!cuerpo) return NextResponse.json({ ok: false, mensaje: "El cuerpo no es válido." }, { status: 400 });

  const fila: Record<string, unknown> = { actualizada_en: new Date().toISOString() };

  // Cambio de estado: viene solo, o junto con los datos.
  if ("estado" in cuerpo) {
    if (cuerpo.estado !== "borrador" && cuerpo.estado !== "publicada") {
      return NextResponse.json({ ok: false, mensaje: "Estado desconocido." }, { status: 400 });
    }
    fila.estado = cuerpo.estado;
  }

  // Cambio de contenido: se valida completo, no por pedacitos.
  if ("titulo" in cuerpo) {
    const texto = (v: unknown) => (typeof v === "string" ? v : "");
    const datos: DatosPublicacion = {
      titulo: texto(cuerpo.titulo),
      bajada: texto(cuerpo.bajada),
      fecha: texto(cuerpo.fecha),
      categoria: texto(cuerpo.categoria),
      imagen: texto(cuerpo.imagen),
      imagenAlt: texto(cuerpo.imagenAlt)
    };
    const errores = validarPublicacion(datos);
    if (hayErrores(errores)) return NextResponse.json({ ok: false, errores }, { status: 400 });

    fila.titulo = datos.titulo.trim();
    fila.bajada = datos.bajada.trim();
    fila.fecha = datos.fecha;
    fila.categoria = datos.categoria.trim();
    fila.imagen = datos.imagen.trim();
    fila.imagen_alt = datos.imagenAlt.trim();
  }

  const { data, error } = await base
    .from("publicaciones")
    .update(fila)
    .eq("slug", params.slug)
    .select("slug")
    .maybeSingle();

  if (error) {
    console.warn(`[base] editar publicación falló — ${error.code ?? "?"}: ${error.message}`);
    return NextResponse.json({ ok: false, mensaje: "No se pudo guardar. Probá de nuevo." }, { status: 503 });
  }
  if (!data) return NextResponse.json({ ok: false, mensaje: "No encontrado." }, { status: 404 });

  revalidarPublicaciones();
  return NextResponse.json({ ok: true });
}

/** Borra la publicación. La imagen queda en el balde: borrar bytes no urge. */
export async function DELETE(_request: Request, { params }: { params: { slug: string } }) {
  const rechazo = await autorizar();
  if (rechazo) return rechazo;

  const base = baseDeDatos();
  if (!base) {
    return NextResponse.json(
      { ok: false, mensaje: "El admin necesita la base de datos configurada." },
      { status: 503 }
    );
  }

  const { data, error } = await base
    .from("publicaciones")
    .delete()
    .eq("slug", params.slug)
    .select("slug")
    .maybeSingle();

  if (error) {
    console.warn(`[base] borrar publicación falló — ${error.code ?? "?"}: ${error.message}`);
    return NextResponse.json({ ok: false, mensaje: "No se pudo borrar. Probá de nuevo." }, { status: 503 });
  }
  if (!data) return NextResponse.json({ ok: false, mensaje: "No encontrado." }, { status: 404 });

  revalidarPublicaciones();
  return NextResponse.json({ ok: true });
}
