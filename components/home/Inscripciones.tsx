import Link from "next/link";

import { HERO, INSCRIPCIONES } from "@/content/elcop";
import { Reveal } from "@/components/ui/Reveal";

/** Bloque de conversión: beca, proceso de admisión, cursada y proyecto final. */
export function Inscripciones() {
  const { beca, etapas, cursada, evaluacionFinal, cupos } = INSCRIPCIONES;

  return (
    <section id="inscripciones" className="section-block">
      <div className="section-heading">
        <div className="max-w-2xl">
          <p className="section-kicker">{INSCRIPCIONES.kicker}</p>
          <h2>{INSCRIPCIONES.titulo}</h2>
        </div>
      </div>

      {/* Titular de la beca. Blanco sobre municipal-700: es la combinación que
          ya usa `.primary-button` y llega a 4.8:1 de contraste. */}
      <Reveal>
        <div className="relative overflow-hidden rounded-[28px] bg-municipal-700 p-8 shadow-card md:p-14">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-white/10"
          />
          <div className="relative max-w-3xl">
            <span aria-hidden="true" className="block h-1.5 w-14 rounded-full bg-brandYellow" />
            {/* Las dos mitades son una sola oración del documento oficial: el
                lector la lee corrida y el titular conserva el peso. */}
            <p className="mt-7 text-base font-semibold leading-relaxed text-white md:text-lg">
              {INSCRIPCIONES.becaIntro}
            </p>
            <p className="mt-2 font-display text-2xl font-extrabold leading-tight tracking-tight text-white sm:text-3xl md:text-[2.5rem]">
              {beca}
            </p>
            <Link
              href={HERO.ctaPrimario.href}
              className="mt-9 inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-5 text-sm font-bold text-municipal-700 shadow-sm transition ease-out hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-municipal-700"
            >
              {HERO.ctaPrimario.etiqueta}
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </Reveal>

      {/* Proceso de admisión */}
      <div className="mt-14">
        <h3 className="font-display text-xl font-extrabold tracking-tight text-ink md:text-2xl">
          Dos etapas, ambas obligatorias
        </h3>
        <p className="mt-2 max-w-2xl text-base leading-relaxed text-slate-600">
          {INSCRIPCIONES.etapasIntro}
        </p>
        <ol className="mt-6 grid gap-4 md:grid-cols-2">
          {etapas.map((etapa, indice) => (
            <li key={etapa.numero}>
              <Reveal retardo={indice * 90} className="h-full">
                <article className="flex h-full flex-col rounded-2xl border border-black/5 bg-white p-6 shadow-card md:p-7">
                  <span
                    aria-hidden="true"
                    className="grid size-12 place-items-center rounded-2xl bg-municipal-50 font-display text-xl font-extrabold text-municipal-700"
                  >
                    {etapa.numero}
                  </span>
                  <h4 className="mt-5 font-display text-lg font-bold text-ink">
                    <span className="sr-only">Etapa {etapa.numero}: </span>
                    {etapa.titulo}
                  </h4>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{etapa.descripcion}</p>
                </article>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>

      {/* Cursada y requisito de asistencia. `items-start` para que cada tarjeta
          mida lo que necesita: estirarlas todas al alto de la más larga deja
          dos con media tarjeta vacía. */}
      <div className="mt-14 grid items-start gap-4 lg:grid-cols-3">
        <Reveal>
          <article className="rounded-2xl border border-black/5 bg-white p-6 shadow-card md:p-7">
            <p className="micro-label">Duración</p>
            <p className="mt-2 font-display text-2xl font-extrabold tracking-tight text-ink">
              {cursada.duracion}
            </p>
          </article>
        </Reveal>

        <Reveal retardo={90}>
          <article className="rounded-2xl border border-black/5 bg-white p-6 shadow-card md:p-7">
            <p className="micro-label">Modalidad</p>
            <p className="mt-2 font-display text-lg font-bold leading-snug text-ink">
              {cursada.modalidad}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              {cursada.modalidadDetalle}
            </p>
          </article>
        </Reveal>

        {/* El requisito de asistencia va destacado, no en letra chica: es la
            condición que hace perder la regularidad. */}
        <Reveal retardo={180}>
          <article className="rounded-2xl border border-municipal-500/25 bg-municipal-50 p-6 shadow-card md:p-7">
            {/* Sobre municipal-50, el municipal-700 se queda en 4,46:1. */}
            <p className="micro-label text-municipal-900">Requisito</p>
            <p className="mt-3">
              <span className="badge-soft bg-white px-3 py-1.5 text-tiny font-bold normal-case text-ink">
                <i className="bg-brandYellow" />
                {cursada.asistencia}
              </span>
            </p>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              Podés faltar hasta un cuarto de los encuentros. Por debajo de ese piso se pierde la
              condición de alumno regular.
            </p>
          </article>
        </Reveal>
      </div>

      {/* Evaluación final */}
      <Reveal>
        <article className="mt-14 grid gap-8 rounded-[28px] bg-sand p-8 md:grid-cols-[1fr_1.4fr] md:p-12">
          <div>
            <p className="section-kicker">Evaluación final</p>
            <h3 className="mt-3 font-display text-2xl font-extrabold leading-tight tracking-tight text-ink md:text-3xl">
              {evaluacionFinal.titulo}
            </h3>
          </div>
          <div className="flex flex-col justify-center">
            <p className="text-base leading-relaxed text-slate-600 md:text-lg">
              {evaluacionFinal.descripcion}
            </p>
          </div>
        </article>
      </Reveal>

      {/* Advertencia de cupos */}
      <Reveal>
        <p className="mt-8 flex items-start gap-3 rounded-2xl border border-black/5 bg-white p-5 text-sm font-semibold text-ink shadow-sm">
          <span
            aria-hidden="true"
            className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-brandYellow font-display text-xs font-extrabold text-ink"
          >
            !
          </span>
          {cupos}
        </p>
      </Reveal>
    </section>
  );
}
