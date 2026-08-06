import { INSTITUCIONAL } from "@/content/elcop";
import { Reveal } from "@/components/ui/Reveal";

/**
 * Bloque institucional sobre banda `sand`: rompe la secuencia de fondos claros
 * y le da respiro al texto largo, que es el más denso de la página.
 */
export function Institucional() {
  return (
    <section id="institucional" className="mt-24 scroll-mt-24 bg-sand py-20 md:py-28">
      <div className="page-shell">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <Reveal>
              <p className="section-kicker">{INSTITUCIONAL.kicker}</p>
              <h2 className="mt-3 font-display text-3xl font-extrabold leading-tight tracking-tight text-ink md:text-4xl">
                {INSTITUCIONAL.titulo}
              </h2>
              <span aria-hidden="true" className="mt-6 block h-1.5 w-14 rounded-full bg-brandYellow" />
            </Reveal>
          </div>

          <div className="lg:col-span-8">
            <Reveal retardo={80}>
              <div className="flex flex-col gap-6">
                {INSTITUCIONAL.parrafos.map((parrafo, indice) => (
                  <p
                    key={indice}
                    className={
                      indice === 0
                        ? "text-lg leading-relaxed text-ink md:text-xl"
                        : "text-base leading-relaxed text-slate-600 md:text-lg"
                    }
                  >
                    {parrafo}
                  </p>
                ))}
              </div>
            </Reveal>

            <Reveal retardo={140}>
              <div className="mt-10 flex flex-wrap items-center gap-3">
                {INSTITUCIONAL.carpeta.disponible ? (
                  <a
                    href={INSTITUCIONAL.carpeta.href}
                    className="secondary-button"
                    download
                  >
                    {INSTITUCIONAL.carpeta.etiqueta}
                    <span aria-hidden="true">↓</span>
                  </a>
                ) : (
                  <>
                    {/* El PDF todavía no existe: el botón queda deshabilitado en
                        vez de llevar a un 404, y al lado se dice por qué. */}
                    <button type="button" className="secondary-button cursor-not-allowed opacity-60" disabled>
                      {INSTITUCIONAL.carpeta.etiqueta}
                      <span aria-hidden="true">↓</span>
                    </button>
                    <span className="badge-soft">
                      <i className="bg-slate-400" />
                      PDF a confirmar
                    </span>
                  </>
                )}
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
