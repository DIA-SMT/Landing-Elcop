import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { formatearFecha } from "@/content/elcop";
import { publicacionesParaAdmin } from "@/lib/publicaciones";
import { permisosDeStaff } from "@/lib/staff";
import { obtenerSesion } from "@/lib/sesion";
import { MarcoAdmin } from "@/components/admin/MarcoAdmin";

export const metadata: Metadata = {
  title: "Contenido — Administración",
  description: "Publicaciones de la landing, editables por la coordinación."
};

export const dynamic = "force-dynamic";

const TEXTO_ESTADO: Record<string, { punto: string; texto: string }> = {
  publicada: { punto: "bg-municipal-700", texto: "Publicada" },
  borrador: { punto: "bg-brandYellow", texto: "Borrador" }
};

/**
 * El listado del contenido editable. Se ven también los borradores —para eso
 * está el admin— con su estado bien visible: la duda de "¿esto lo ve la
 * gente?" se responde acá, no entrando a cada nota.
 */
export default async function PaginaContenido() {
  const sesion = await obtenerSesion();
  if (!sesion) redirect("/portal");
  if (!(await permisosDeStaff(sesion.documento))?.contenido) notFound();

  const publicaciones = await publicacionesParaAdmin();

  return (
    <MarcoAdmin titulo="Publicaciones">
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm leading-relaxed text-slate-600">
            Lo que está <span className="font-bold text-ink">publicado</span> se ve en la landing;
            un <span className="font-bold text-ink">borrador</span> sólo existe acá.
          </p>
          <Link href="/admin/contenido/nueva" className="primary-button">
            Nueva publicación
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        {publicaciones.length === 0 ? (
          <p className="rounded-[24px] border border-black/5 bg-white p-6 text-sm leading-relaxed text-slate-600 shadow-card">
            Todavía no hay publicaciones. Creá la primera con el botón de arriba.
          </p>
        ) : (
          <ul className="flex flex-col gap-4">
            {publicaciones.map((publicacion) => {
              const estilo = TEXTO_ESTADO[publicacion.estado] ?? TEXTO_ESTADO.borrador;
              return (
                <li key={publicacion.slug}>
                  <article className="rounded-[24px] border border-black/5 bg-white p-5 shadow-card md:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
                      <div className="min-w-0">
                        <h2 className="texto-de-usuario font-display text-lg font-bold leading-snug text-ink">
                          {publicacion.titulo}
                        </h2>
                        <p className="mt-1 text-tiny text-slate-600">
                          {publicacion.categoria} · {formatearFecha(publicacion.fecha)}
                        </p>
                      </div>
                      <span className="badge-soft">
                        <i className={estilo.punto} />
                        {estilo.texto}
                      </span>
                    </div>

                    <p className="texto-de-usuario mt-3 line-clamp-2 text-sm leading-relaxed text-slate-600">
                      {publicacion.bajada}
                    </p>

                    <p className="mt-4">
                      {/* Sin `compact`: baja el alto a 40px y se cae del
                          objetivo táctil, como avisa MarcoComite. */}
                      <Link
                        href={`/admin/contenido/${publicacion.slug}`}
                        className="secondary-button"
                      >
                        Editar
                      </Link>
                    </p>
                  </article>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </MarcoAdmin>
  );
}
