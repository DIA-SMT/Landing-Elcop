import Link from "next/link";

import { DIPLOMATURA, ESCUELA, HERO, INSCRIPCIONES, formatearNumero } from "@/content/elcop";
import { Reveal } from "@/components/ui/Reveal";

export function Hero() {
  return (
    <section id="inicio" className="relative isolate overflow-hidden scroll-mt-24 bg-white">
      {/* Fondo: dos manchas de luz muy tenues y una grilla fina. Es decorativo,
          no lleva contenido y queda fuera del árbol de accesibilidad. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-40 -top-56 size-[680px] rounded-full bg-municipal-100/70 blur-3xl" />
        <div className="absolute -right-48 top-24 size-[560px] rounded-full bg-municipal-50 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(18,34,29,.055) 1px, transparent 1px), linear-gradient(to bottom, rgba(18,34,29,.055) 1px, transparent 1px)",
            backgroundSize: "72px 72px",
            maskImage: "radial-gradient(ellipse 90% 65% at 50% 0%, #000 30%, transparent 100%)",
            WebkitMaskImage: "radial-gradient(ellipse 90% 65% at 50% 0%, #000 30%, transparent 100%)"
          }}
        />
      </div>

      <div className="page-shell pb-24 pt-14 md:pb-28 md:pt-20 lg:pb-[7.5rem] lg:pt-24">
        <div className="grid items-center gap-14 lg:grid-cols-12 lg:gap-10">
          {/* Columna de texto */}
          <div className="lg:col-span-7">
            <Reveal>
              <p className="eyebrow">
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
              <p className="mt-8 text-sm text-slate-500">
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
