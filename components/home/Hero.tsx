import Link from "next/link";

import { DIPLOMATURA, ESCUELA, HERO, INSCRIPCIONES, formatearNumero } from "@/content/elcop";
import { Reveal } from "@/components/ui/Reveal";
import { VideoFondoHero } from "@/components/home/VideoFondoHero";

export function Hero() {
  return (
    <section id="inicio" className="relative isolate overflow-hidden scroll-mt-24 bg-white">
      {/* Fondo de video con velo. Es decorativo: no lleva contenido y queda
          fuera del árbol de accesibilidad.

          El velo es más denso a la izquierda, que es donde vive el texto, y se
          afloja hacia la derecha, donde sólo está la tarjeta (que es blanca y
          opaca). Así el video se percibe sin que ningún texto pierda contraste:
          incluso sobre un fotograma completamente negro, el título en `ink`
          queda en 11,7:1. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <VideoFondoHero />
        {/* En móvil el velo baja en vertical, porque no hay dos columnas y el
            texto ocupa todo el ancho. De 768px para arriba se vuelve
            horizontal: se mantiene al 82% hasta el 60% del ancho, que es hasta
            donde llega el texto, y después se abre al 52% del lado de la
            tarjeta, que es blanca y opaca.

            El 82% no es un número elegido a ojo. Midiendo los fotogramas
            reales, el bloque más oscuro que cae detrás del texto es
            prácticamente negro, y ahí "transforman" en municipal-700 queda en
            3,18:1 — apenas por encima del 3:1 que pide el texto grande. Bajar
            a 75% lo dejaría en 2,64 y también voltearía la bajada. */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.88] via-white/[0.84] to-white/[0.82] md:bg-gradient-to-r md:from-white/[0.85] md:via-white/[0.82] md:via-[60%] md:to-white/[0.52]" />
        {/* Difumina el corte de abajo contra el fondo de la página. */}
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent to-[#f8fbff]" />
      </div>

      <div className="page-shell pb-24 pt-14 md:pb-28 md:pt-20 lg:pb-[7.5rem] lg:pt-24">
        <div className="grid items-center gap-14 lg:grid-cols-12 lg:gap-10">
          {/* Columna de texto */}
          <div className="lg:col-span-7">
            <Reveal>
              {/* Opaco a propósito: el `bg-white/70` de `.eyebrow` deja pasar
                  el video, y el municipal-700 a 10px necesita blanco puro
                  detrás para llegar a 4,5:1. */}
              <p className="eyebrow bg-white">
                <span aria-hidden="true" className="size-1.5 rounded-full bg-municipal-700" />
                {HERO.eyebrow}
              </p>
            </Reveal>

            <Reveal retardo={60}>
              <h1 className="mt-6 max-w-[15ch] font-display text-[2.15rem] font-extrabold leading-[1.06] tracking-tight text-ink sm:text-5xl lg:text-6xl xl:text-[4.15rem]">
                Formando a los líderes que{" "}
                <span className="text-municipal-700">transforman</span> San Miguel de Tucumán
              </h1>
            </Reveal>

            <Reveal retardo={120}>
              {/* Filete amarillo: acento de marca en un elemento gráfico, nunca
                  como fondo de texto. */}
              <span aria-hidden="true" className="mt-8 block h-1.5 w-16 rounded-full bg-brandYellow" />
              <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-600 md:text-lg">
                {HERO.bajada}
              </p>
            </Reveal>

            <Reveal retardo={180}>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link href={HERO.ctaPrimario.href} className="primary-button justify-center sm:justify-start">
                  {HERO.ctaPrimario.etiqueta}
                  <span aria-hidden="true">→</span>
                </Link>
                <Link href={HERO.ctaSecundario.href} className="secondary-button justify-center sm:justify-start">
                  {HERO.ctaSecundario.etiqueta}
                </Link>
              </div>
            </Reveal>

            <Reveal retardo={240}>
              {/* slate-600 y no slate-500: el 500 llega justo a 4,5:1 contra
                  blanco puro, y acá abajo hay video. */}
              <p className="mt-8 text-sm text-slate-600">
                <span className="font-bold text-ink">{formatearNumero(1091)} personas</span> se
                postularon a la primera convocatoria.
              </p>
            </Reveal>
          </div>

          {/* Columna de tarjeta: la convocatoria resumida, sin ilustración de
              stock. Todo el peso visual lo lleva la tipografía. */}
          <div className="lg:col-span-5">
            <Reveal retardo={220}>
              <div className="relative mx-auto max-w-md rounded-[28px] border border-black/5 bg-white p-7 shadow-card md:p-8">
                <p className="section-kicker">{ESCUELA.cohorte}</p>

                <p className="mt-4 font-display text-6xl font-extrabold leading-none tracking-tight text-municipal-700">
                  100<span className="text-4xl">%</span>
                </p>
                <p className="mt-3 text-sm font-bold text-ink">Beca para las personas seleccionadas</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">
                  Otorgada por la Municipalidad de SMT y la UNSTA. La cursada no tiene arancel ni
                  matrícula.
                </p>

                <dl className="mt-7 divide-y divide-slate-100 border-t border-slate-100">
                  <FilaDato termino="Duración" definicion={DIPLOMATURA.duracion} />
                  <FilaDato termino="Modalidad" definicion="Presencial + virtual sincronizada" />
                  <FilaDato termino="Cupo" definicion="80 becarios" />
                  <FilaDato termino="Ingreso" definicion="Postulación + entrevista" />
                </dl>

                <p className="mt-6 flex items-center gap-2 text-tiny font-semibold text-slate-500">
                  <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-brandYellow" />
                  {INSCRIPCIONES.cupos}
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

function FilaDato({ termino, definicion }: { termino: string; definicion: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-3">
      <dt className="micro-label">{termino}</dt>
      <dd className="text-right text-sm font-bold text-ink">{definicion}</dd>
    </div>
  );
}
