import { NextResponse } from "next/server";

import { permisosDeStaff } from "@/lib/staff";
import { obtenerSesion } from "@/lib/sesion";
import { baseDeDatos } from "@/lib/supabase";

/**
 * Sube la imagen de portada de una publicación al balde `publicaciones`.
 *
 * El navegador nunca habla con el Storage: sube acá, y el servidor —con la
 * clave secreta— la deposita en el balde y devuelve la URL pública. El balde
 * es de lectura pública porque la landing sirve las fotos directo; la
 * escritura queda solo de este lado.
 */

const TIPOS_PERMITIDOS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp"
};

/** 5 MB alcanza para una portada; una foto de cámara sin achicar no entra. */
const TAMANIO_MAXIMO = 5 * 1024 * 1024;

export async function POST(request: Request) {
  const sesion = await obtenerSesion();
  if (!sesion) return NextResponse.json({ ok: false, mensaje: "Iniciá sesión." }, { status: 401 });

  const permisos = await permisosDeStaff(sesion.documento).catch(() => null);
  if (!permisos?.contenido) {
    return NextResponse.json({ ok: false, mensaje: "No encontrado." }, { status: 404 });
  }

  const base = baseDeDatos();
  if (!base) {
    return NextResponse.json(
      { ok: false, mensaje: "El admin necesita la base de datos configurada." },
      { status: 503 }
    );
  }

  const formulario = await request.formData().catch(() => null);
  const archivo = formulario?.get("archivo");
  if (!(archivo instanceof File)) {
    return NextResponse.json({ ok: false, mensaje: "Falta el archivo." }, { status: 400 });
  }

  const extension = TIPOS_PERMITIDOS[archivo.type];
  if (!extension) {
    return NextResponse.json(
      { ok: false, mensaje: "Formato no admitido: tiene que ser JPG, PNG o WebP." },
      { status: 400 }
    );
  }
  if (archivo.size > TAMANIO_MAXIMO) {
    return NextResponse.json(
      { ok: false, mensaje: "La imagen supera los 5 MB. Achicala antes de subirla." },
      { status: 400 }
    );
  }

  // El nombre no viene del archivo: un nombre elegido por el cliente es un
  // vector (rutas, caracteres raros, pisadas). Fecha + azar y la extensión
  // deducida del tipo real.
  const nombre = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${extension}`;

  const { error } = await base.storage
    .from("publicaciones")
    .upload(nombre, archivo, { contentType: archivo.type, cacheControl: "31536000" });

  if (error) {
    console.warn(`[base] subir imagen falló — ${error.message}`);
    return NextResponse.json({ ok: false, mensaje: "No se pudo subir. Probá de nuevo." }, { status: 503 });
  }

  const { data } = base.storage.from("publicaciones").getPublicUrl(nombre);
  return NextResponse.json({ ok: true, url: data.publicUrl }, { status: 201 });
}
