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
        {/* Dos velos distintos, porque debajo hay dos cosas distintas.

            **Móvil (hasta 768px): 60%.** Acá el video no se descarga nunca
            —ver `VideoFondoHero`—, así que lo único que hay debajo es la
            portada, y la portada no tiene negros: midiendo el recorte que cae
            detrás del texto, su percentil 1 está en 0,58 de sRGB. El velo que
            de verdad hace falta es 0,49; estaba en 0,88, unos cuarenta puntos
            de más heredados de dimensionarlo contra el video. De ahí que se
            viera blanco justo en el tamaño donde entra la mayoría.

            **De 768px para arriba: 86% a la izquierda, 24% a la derecha.** Acá
            sí hay video y sí llega a negro (percentil 1 en 0,055), así que la
            zona del texto se mantiene densa. Lo que cambia es a dónde va
            después: la tarjeta es blanca y opaca y no hay texto suelto pasando
            el 58% del ancho, así que de ahí en adelante el video se muestra
            casi sin velar en vez de quedarse a mitad de camino en 52%.

            Los números salen de medir, no de tantear. El piso que necesita cada
            texto sobre el fotograma más oscuro es: 0,79 para "transforman" en
            municipal-700, 0,78 para la bajada y la línea de postulantes en
            slate-600, y apenas 0,38 para el título en ink. **El título grande
            no es la restricción: lo son la palabra azul y el texto gris
            chico.** Mientras esos dos colores no cambien, la mitad izquierda no
            puede aclararse mucho más sin voltear el contraste. */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.62] via-white/[0.58] to-white/[0.56] md:bg-gradient-to-r md:from-white/[0.86] md:via-white/[0.82] md:via-[58%] md:to-white/[0.24]" />
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
