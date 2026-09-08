import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import {
  hayErrores,
  slugDesdeTitulo,
  validarPublicacion,
  type DatosPublicacion
} from "@/lib/admin/validacion-publicacion";
import { permisosDeStaff } from "@/lib/staff";
import { obtenerSesion } from "@/lib/sesion";
import { baseDeDatos } from "@/lib/supabase";

/**
 * Alta y edición de publicaciones. Sólo staff con permiso de contenido.
 *
 * - **El rol se resuelve del documento de la sesión en cada pedido**, como en
 *   el comité. Sin permiso, 404: que la ruta exista no es asunto de quien no
 *   la puede usar.
 * - Cada escritura revalida las páginas que muestran publicaciones: quien
 *   publica ve el sitio actualizado al instante, sin deploy.
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

function leerDatos(cuerpo: unknown): DatosPublicacion | null {
  if (typeof cuerpo !== "object" || cuerpo === null) return null;
  const c = cuerpo as Record<string, unknown>;
  const texto = (v: unknown) => (typeof v === "string" ? v : "");
  return {
    titulo: texto(c.titulo),
    bajada: texto(c.bajada),
    fecha: texto(c.fecha),
    categoria: texto(c.categoria),
    imagen: texto(c.imagen),
    imagenAlt: texto(c.imagenAlt)
  };
}

function revalidarPublicaciones(): void {
  revalidatePath("/publicaciones");
}

/** Crea una publicación. Nace como borrador: publicar es un acto aparte. */
export async function POST(request: Request) {
  const rechazo = await autorizar();
  if (rechazo) return rechazo;

  const base = baseDeDatos();
  if (!base) {
    return NextResponse.json(
      { ok: false, mensaje: "El admin necesita la base de datos configurada." },
      { status: 503 }
    );
  }

  const datos = leerDatos(await request.json().catch(() => null));
  if (!datos) return NextResponse.json({ ok: false, mensaje: "El cuerpo no es válido." }, { status: 400 });

  const errores = validarPublicacion(datos);
  if (hayErrores(errores)) return NextResponse.json({ ok: false, errores }, { status: 400 });

  const slug = slugDesdeTitulo(datos.titulo);
  if (!slug) {
    return NextResponse.json(
      { ok: false, errores: { titulo: "El título necesita letras o números para armar su URL." } },
      { status: 400 }
    );
  }

  const { error } = await base.from("publicaciones").insert({
    slug,
    titulo: datos.titulo.trim(),
    bajada: datos.bajada.trim(),
    fecha: datos.fecha,
    categoria: datos.categoria.trim(),
    imagen: datos.imagen.trim(),
    imagen_alt: datos.imagenAlt.trim(),
    estado: "borrador"
  });

  if (error) {
    // 23505 = clave duplicada: ya hay una nota cuyo título arma el mismo slug.
    if (error.code === "23505") {
      return NextResponse.json(
        { ok: false, errores: { titulo: "Ya existe una publicación con un título casi igual. Cambialo un poco." } },
        { status: 409 }
      );
    }
    console.warn(`[base] crear publicación falló — ${error.code ?? "?"}: ${error.message}`);
    return NextResponse.json({ ok: false, mensaje: "No se pudo guardar. Probá de nuevo." }, { status: 503 });
  }

  revalidarPublicaciones();
  return NextResponse.json({ ok: true, slug }, { status: 201 });
}
