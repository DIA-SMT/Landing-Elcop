import { INDICADORES } from "@/content/elcop";
import { ContadorAnimado } from "@/components/ui/ContadorAnimado";
import { Reveal } from "@/components/ui/Reveal";

/**
 * Franja de indicadores. Monta por encima del borde inferior del hero para
 * que se lea como una sola pieza con él.
 */
export function Indicadores() {
  return (
    <section aria-labelledby="indicadores-titulo" className="relative z-10 -mt-16 md:-mt-20">
      <h2 id="indicadores-titulo" className="sr-only">
        La Escuela en números
      </h2>

      <div className="page-shell">
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {INDICADORES.map((indicador, indice) => (
            <li key={indicador.id}>
              <Reveal retardo={indice * 90}>
                <article className="stat-card h-full flex-col items-start gap-0 p-6 transition ease-out hover:-translate-y-1 hover:shadow-lg md:p-7">
                  <p className="font-display text-[2.75rem] font-extrabold leading-none tracking-tight text-municipal-700 md:text-5xl">
                    <ContadorAnimado valor={indicador.valor} sufijo={indicador.sufijo} />
                  </p>
                  <p className="mt-4 font-display text-base font-bold text-ink">{indicador.etiqueta}</p>
                  <p className="mt-1 text-sm text-slate-500">{indicador.detalle}</p>
                </article>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
