import { ESCUELA, REFERENTES, iniciales } from "@/content/elcop";
import { Reveal } from "@/components/ui/Reveal";

/** Disertantes de las masterclass. Es la prueba del nivel académico. */
export function Referentes() {
  return (
    <section aria-labelledby="referentes-titulo" className="section-block">
      <div className="section-heading">
        <div className="max-w-2xl">
          <p className="section-kicker">Masterclass</p>
          <h2 id="referentes-titulo">Referentes que ya pasaron por {ESCUELA.nombreCorto}</h2>
          <p className="text-base">
            Investigadores, consultores y especialistas que dictaron clases en la {ESCUELA.cohorte}.
          </p>
        </div>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {REFERENTES.map((referente, indice) => (
          <li key={referente.nombre}>
            <Reveal retardo={(indice % 3) * 80} className="h-full">
              <article className="flex h-full flex-col rounded-2xl border border-black/5 bg-white p-6 shadow-card transition ease-out hover:-translate-y-1 hover:shadow-lg">
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    // municipal-900 y no 700: sobre `sand`, el 700 se queda en 4,39:1.
                    className="grid size-11 shrink-0 place-items-center rounded-xl bg-sand font-display text-sm font-extrabold tracking-tight text-municipal-900"
                  >
                    {iniciales(referente.nombre)}
                  </span>
                  <h3 className="font-display text-base font-bold leading-snug text-ink">
                    {referente.nombre}
                  </h3>
                </div>

                <p className="mt-4 text-sm leading-relaxed text-slate-600">{referente.credencial}</p>

                <p className="mt-auto pt-5">
                  <span className="badge-soft px-3 py-1.5 text-tiny font-semibold normal-case">
                    <i className="bg-municipal-500" />
                    {referente.tema}
                  </span>
                </p>
              </article>
            </Reveal>
          </li>
        ))}
      </ul>
    </section>
  );
}
