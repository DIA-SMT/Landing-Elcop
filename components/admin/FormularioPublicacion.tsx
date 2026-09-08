"use client";

import Image from "next/image";
import { useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import {
  LIMITES_PUBLICACION,
  hayErrores,
  validarPublicacion,
  type DatosPublicacion,
  type ErroresPublicacion
} from "@/lib/admin/validacion-publicacion";

/**
 * Alta y edición de una publicación.
 *
 * Un solo formulario para los dos modos: `slug` presente = edición. Guardar
 * nunca publica: publicar es un botón aparte con su propio verbo, para que
 * nadie suba algo a la landing por accidente mientras corrige una coma.
 */
export function FormularioPublicacion({
  slug,
  inicial,
  estado
}: {
  /** Sin slug es un alta; con slug, edición. */
  slug?: string;
  inicial?: DatosPublicacion;
  estado?: string;
}) {
  const idBase = useId();
  const router = useRouter();
  const archivoRef = useRef<HTMLInputElement>(null);

  const [datos, setDatos] = useState<DatosPublicacion>(
    inicial ?? { titulo: "", bajada: "", fecha: "", categoria: "", imagen: "", imagenAlt: "" }
  );
  const [errores, setErrores] = useState<ErroresPublicacion>({});
  const [aviso, setAviso] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState<"guardando" | "subiendo" | "publicando" | "borrando" | null>(null);

  const cambiar = (campo: keyof DatosPublicacion, valor: string) => {
    const nuevos = { ...datos, [campo]: valor };
    setDatos(nuevos);
    if (errores[campo]) setErrores(validarPublicacion(nuevos));
  };

  /* ---------------------------- acciones ---------------------------------- */

  const subirImagen = async (archivo: File) => {
    setOcupado("subiendo");
    setAviso(null);
    try {
      const cuerpo = new FormData();
      cuerpo.append("archivo", archivo);
      const respuesta = await fetch("/api/admin/imagenes", { method: "POST", body: cuerpo });
      const resultado = (await respuesta.json().catch(() => null)) as { url?: string; mensaje?: string } | null;
      if (respuesta.ok && resultado?.url) {
        cambiar("imagen", resultado.url);
      } else {
        setAviso(resultado?.mensaje ?? "No se pudo subir la imagen. Probá de nuevo.");
      }
    } catch {
      setAviso("No se pudo subir la imagen. Probá de nuevo.");
    } finally {
      setOcupado(null);
    }
  };

  const guardar = async () => {
    const nuevos = validarPublicacion(datos);
    setErrores(nuevos);
    if (hayErrores(nuevos)) return;

    setOcupado("guardando");
    setAviso(null);
    try {
      const respuesta = await fetch(
        slug ? `/api/admin/publicaciones/${slug}` : "/api/admin/publicaciones",
        {
          method: slug ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(datos)
        }
      );
      const resultado = (await respuesta.json().catch(() => null)) as {
        slug?: string;
        errores?: ErroresPublicacion;
        mensaje?: string;
      } | null;

      if (respuesta.ok) {
        if (slug) {
          setAviso("Guardado.");
          router.refresh();
        } else {
          // El alta sigue en su página de edición, donde están publicar y borrar.
          router.push(`/admin/contenido/${resultado?.slug}`);
        }
        return;
      }
      if (resultado?.errores) setErrores(resultado.errores);
      setAviso(resultado?.mensaje ?? (resultado?.errores ? null : "No se pudo guardar. Probá de nuevo."));
    } catch {
      setAviso("No se pudo guardar. Probá de nuevo.");
    } finally {
      setOcupado(null);
    }
  };

  const cambiarEstado = async (nuevo: "publicada" | "borrador") => {
    setOcupado("publicando");
    setAviso(null);
    try {
      const respuesta = await fetch(`/api/admin/publicaciones/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevo })
      });
      if (respuesta.ok) {
        setAviso(nuevo === "publicada" ? "Publicada: ya se ve en la landing." : "Pasada a borrador: ya no se ve en la landing.");
        router.refresh();
      } else {
        setAviso("No se pudo cambiar el estado. Probá de nuevo.");
      }
    } catch {
      setAviso("No se pudo cambiar el estado. Probá de nuevo.");
    } finally {
      setOcupado(null);
    }
  };

  const borrar = async () => {
    // confirm nativo y no un modal propio: es una acción rara, de staff, y el
    // navegador ya sabe preguntar "¿estás seguro?" de forma accesible.
    if (!window.confirm("¿Borrar esta publicación? No se puede deshacer.")) return;

    setOcupado("borrando");
    try {
      const respuesta = await fetch(`/api/admin/publicaciones/${slug}`, { method: "DELETE" });
      if (respuesta.ok) {
        router.push("/admin/contenido");
        return;
      }
      setAviso("No se pudo borrar. Probá de nuevo.");
    } catch {
      setAviso("No se pudo borrar. Probá de nuevo.");
    } finally {
      setOcupado(null);
    }
  };

  /* ----------------------------- campos ----------------------------------- */

  const campo = (
    nombre: keyof DatosPublicacion,
    etiqueta: string,
    ayuda: string,
    props: { tipo?: "text" | "date"; area?: boolean; maximo?: number } = {}
  ) => {
    const id = `${idBase}-${nombre}`;
    const error = errores[nombre];
    const comunes = {
      id,
      value: datos[nombre],
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        cambiar(nombre, e.target.value),
      "aria-invalid": Boolean(error),
      "aria-describedby": [`${id}-ayuda`, error ? `${id}-error` : null].filter(Boolean).join(" "),
      className: "form-control"
    };
    return (
      <div className="form-field">
        <label htmlFor={id} className="form-label">
          {etiqueta}
          <span className="ml-1 text-red-600" aria-hidden="true">*</span>
        </label>
        {props.area ? (
          <textarea {...comunes} rows={3} maxLength={props.maximo} className="form-control resize-y" />
        ) : (
          <input {...comunes} type={props.tipo ?? "text"} maxLength={props.maximo} />
        )}
        <p id={`${id}-ayuda`} className="max-w-prose text-tiny text-slate-600">
          {ayuda}
        </p>
        {error && (
          <p id={`${id}-error`} className="form-error">
            <span aria-hidden="true">⚠</span>
            {error}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      {slug && (
        <p className="flex flex-wrap items-center gap-2 rounded-2xl border border-black/5 bg-white p-4 text-sm text-slate-600 shadow-sm">
          <span className="badge-soft">
            <i className={estado === "publicada" ? "bg-municipal-700" : "bg-brandYellow"} />
            {estado === "publicada" ? "Publicada" : "Borrador"}
          </span>
          {estado === "publicada"
            ? "Esta nota se ve en la landing. Los cambios que guardes salen al instante."
            : "Esta nota NO se ve en la landing hasta que la publiques."}
        </p>
      )}

      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          void guardar();
        }}
        className="rounded-[24px] border border-black/5 bg-white p-6 shadow-card md:p-8"
      >
        <div className="flex flex-col gap-5">
          {campo("titulo", "Título", `Entre ${LIMITES_PUBLICACION.titulo.minimo} y ${LIMITES_PUBLICACION.titulo.maximo} caracteres. De acá sale la URL de la nota.`, { maximo: LIMITES_PUBLICACION.titulo.maximo })}
          {campo("bajada", "Bajada", "El resumen que se ve en la tarjeta, dos o tres frases.", { area: true, maximo: LIMITES_PUBLICACION.bajada.maximo })}
          <div className="grid gap-5 sm:grid-cols-2">
            {campo("fecha", "Fecha", "La del hecho que se cuenta, no la de hoy.", { tipo: "date" })}
            {campo("categoria", "Categoría", "Por ejemplo: Plenario, Novedad, Convocatoria.", { maximo: LIMITES_PUBLICACION.categoria.maximo })}
          </div>

          {/* ------------------------- imagen ------------------------------ */}
          <div className="form-field">
            <span className="form-label">
              Imagen de portada
              <span className="ml-1 text-red-600" aria-hidden="true">*</span>
            </span>
            {datos.imagen && (
              <div className="relative aspect-[16/9] w-full max-w-md overflow-hidden rounded-xl bg-municipal-50">
                {/* La vista previa usa el alt escrito abajo: lo que se guarda es lo que se prueba. */}
                <Image src={datos.imagen} alt={datos.imagenAlt || "Vista previa de la portada"} fill sizes="448px" className="object-cover" />
              </div>
            )}
            <input
              ref={archivoRef}
              id={`${idBase}-archivo`}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              aria-describedby={`${idBase}-archivo-ayuda${errores.imagen ? ` ${idBase}-archivo-error` : ""}`}
              aria-invalid={Boolean(errores.imagen)}
              onChange={(e) => {
                const archivo = e.target.files?.[0];
                if (archivo) void subirImagen(archivo);
              }}
              className="form-control file:mr-3 file:rounded-lg file:border-0 file:bg-municipal-50 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-municipal-900"
            />
            <p id={`${idBase}-archivo-ayuda`} className="max-w-prose text-tiny text-slate-600">
              JPG, PNG o WebP, hasta 5 MB. {ocupado === "subiendo" ? "Subiendo…" : ""}
            </p>
            {errores.imagen && (
              <p id={`${idBase}-archivo-error`} className="form-error">
                <span aria-hidden="true">⚠</span>
                {errores.imagen}
              </p>
            )}
          </div>

          {campo("imagenAlt", "Descripción de la imagen", "Lo que escucha quien usa lector de pantalla: qué se ve en la foto, sin interpretar.", { area: true, maximo: LIMITES_PUBLICACION.imagenAlt.maximo })}
        </div>

        <div aria-live="polite" className="mt-6">
          {aviso && (
            <p className="rounded-2xl border border-black/5 bg-municipal-50 p-4 text-sm font-semibold text-municipal-900">
              {aviso}
            </p>
          )}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-3">
            <button type="submit" className="primary-button" disabled={ocupado !== null}>
              {ocupado === "guardando" ? "Guardando…" : slug ? "Guardar cambios" : "Crear como borrador"}
            </button>
            {slug && estado === "borrador" && (
              <button type="button" className="secondary-button" disabled={ocupado !== null} onClick={() => void cambiarEstado("publicada")}>
                {ocupado === "publicando" ? "Publicando…" : "Publicar en la landing"}
              </button>
            )}
            {slug && estado === "publicada" && (
              <button type="button" className="secondary-button" disabled={ocupado !== null} onClick={() => void cambiarEstado("borrador")}>
                {ocupado === "publicando" ? "Cambiando…" : "Volver a borrador"}
              </button>
            )}
          </div>
          {slug && (
            <button
              type="button"
              disabled={ocupado !== null}
              onClick={() => void borrar()}
              className="min-h-11 rounded-full px-4 text-sm font-semibold text-red-700 transition ease-out hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2"
            >
              {ocupado === "borrando" ? "Borrando…" : "Borrar publicación"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
