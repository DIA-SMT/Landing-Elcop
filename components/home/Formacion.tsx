import { DIPLOMATURA, EJES, ESCUELA } from "@/content/elcop";
import { Reveal } from "@/components/ui/Reveal";

/**
 * El programa como recorrido numerado, no como tarjetas iguales: la progresión
 * mensual (mensaje → institución → agendas → proyecto final) es parte del
 * argumento pedagógico, así que se lee de arriba hacia abajo sobre un riel.
 * El contenido es el programa real dictado en 2026 — ver `EJES` en el content.
 */
export function Formacion() {
  return (
    <section id="formacion" className="section-block">
      <div className="section-heading">
        <div className="max-w-3xl">
          <p className="section-kicker">{DIPLOMATURA.kicker}</p>
          <h2>{DIPLOMATURA.titulo}</h2>
          <p className="text-base">{DIPLOMATURA.bajada}</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <span className="badge-soft">
            <i className="bg-municipal-700" />
            {DIPLOMATURA.duracion}
          </span>
          <span className="badge-soft">
            <i className="bg-municipal-700" />
            {ESCUELA.cohorte}
          </span>
        </div>
      </div>

      <ol className="mt-4 flex flex-col">
        {EJES.map((eje, indice) => {
          const ultimo = indice === EJES.length - 1;
          return (
            <li key={eje.numero}>
              <Reveal>
                <div className="grid gap-4 md:grid-cols-[7rem_1fr] md:gap-10">
                  <div className="md:pt-1">
                    <p className="micro-label">Mes {eje.numero}</p>
                    <p
                      aria-hidden="true"
                      className="mt-1 font-display text-[3.5rem] font-extrabold leading-none tracking-tight text-municipal-700 tabular-nums md:text-7xl"
                    >
                      {String(eje.numero).padStart(2, "0")}
                    </p>
                  </div>

                  {/* El riel es el borde izquierdo de esta columna: al llevar
                      adentro el espacio inferior, la línea queda continua
                      entre un eje y el siguiente. */}
                  <div
                    className={`border-slate-200 md:border-l md:pl-10 ${ultimo ? "pb-2" : "pb-12 md:pb-16"}`}
                  >
                    <h3 className="font-display text-2xl font-extrabold tracking-tight text-ink md:text-3xl">
                      {eje.titulo}
                    </h3>
                    <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-600">
                      {eje.descripcion}
                    </p>
                    <ul className="mt-5 flex flex-wrap gap-2">
                      {eje.temas.map((tema) => (
                        <li key={tema}>
                          {/* Chips de temario: en minúscula y a 11px, que se
                              leen mejor que el badge de estado a 10px. */}
                          <span className="badge-soft px-3 py-1.5 text-tiny font-semibold normal-case">
                            <i className="bg-municipal-500" />
                            {tema}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Reveal>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
