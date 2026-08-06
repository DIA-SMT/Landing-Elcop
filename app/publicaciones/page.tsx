import type { Metadata } from "next";
import Image from "next/image";

import { PUBLICACIONES, formatearFecha } from "@/content/elcop";
import { Reveal } from "@/components/ui/Reveal";

export const metadata: Metadata = {
  title: "Publicaciones",
  description:
    "Notas y crónicas de las masterclass y actividades de la Escuela de Liderazgo y Comunicación Política."
};

export default function PaginaPublicaciones() {
  const hayEjemplos = PUBLICACIONES.some((publicacion) => publicacion.esEjemplo);

  return (
    <section className="page-shell py-16 md:py-24">
      <header className="max-w-2xl">
        <p className="section-kicker">Publicaciones</p>
        <h1 className="mt-3 font-display text-4xl font-extrabold leading-tight tracking-tight text-ink md:text-5xl">
          Lo que pasa en la Escuela
        </h1>
        <p className="mt-4 text-base leading-relaxed text-slate-600 md:text-lg">
          Crónicas de las masterclass, materiales y novedades de la cohorte.
        </p>
      </header>

      {/* Los contenidos de ejemplo se avisan arriba de todo, no sólo en cada
          tarjeta: nadie tiene que deducirlo tarjeta por tarjeta. */}
      {hayEjemplos && (
        <p className="mt-8 flex flex-wrap items-center gap-2 rounded-2xl border border-black/5 bg-white p-4 text-sm text-slate-600 shadow-sm">
          <span className="badge-soft">
            <i className="bg-brandYellow" />
            Contenido de ejemplo
          </span>
          Las notas de abajo se armaron sobre masterclass que sí se dictaron, pero los textos son
          provisorios y todavía no fueron publicados por ELCOP.
        </p>
      )}

      <ul className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {PUBLICACIONES.map((publicacion, indice) => (
          <li key={publicacion.slug}>
            <Reveal retardo={(indice % 3) * 90} className="h-full">
              <article className="flex h-full flex-col overflow-hidden rounded-[24px] border border-black/5 bg-white shadow-card transition ease-out hover:-translate-y-1 hover:shadow-lg">
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-municipal-50">
                  <Image
                    src={publicacion.imagen}
                    alt={publicacion.imagenAlt}
                    fill
                    sizes="(min-width: 1280px) 380px, (min-width: 768px) 45vw, 92vw"
                    className="object-cover"
                  />
                </div>

                <div className="flex flex-1 flex-col p-6">
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="badge-soft">
                      <i className="bg-municipal-700" />
                      {publicacion.categoria}
                    </span>
                    {publicacion.esEjemplo && (
                      <span className="badge-soft">
                        <i className="bg-brandYellow" />
                        Ejemplo
                      </span>
                    )}
                  </p>

                  <h2 className="mt-4 font-display text-lg font-extrabold leading-snug tracking-tight text-ink">
                    {publicacion.titulo}
                  </h2>

                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{publicacion.bajada}</p>

                  <p className="mt-auto pt-5">
                    <time dateTime={publicacion.fecha} className="text-tiny font-semibold text-slate-500">
                      {formatearFecha(publicacion.fecha)}
                    </time>
                  </p>
                </div>
              </article>
            </Reveal>
          </li>
        ))}
      </ul>
    </section>
  );
}
