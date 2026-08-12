import Image from "next/image";

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
          <div className="lg:col-span-5">
            <Reveal>
              <p className="section-kicker">{INSTITUCIONAL.kicker}</p>
              <h2 className="mt-3 font-display text-3xl font-extrabold leading-tight tracking-tight text-ink md:text-4xl">
                {INSTITUCIONAL.titulo}
              </h2>
              <span aria-hidden="true" className="mt-6 block h-1.5 w-14 rounded-full bg-brandYellow" />
            </Reveal>

            <Reveal retardo={120}>
              {/* La sede donde se cursa. La proporción 4:3 es casi la de la
                  foto original, así que casi no se recorta. */}
              <figure className="mt-8">
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[22px] bg-white shadow-card">
                  <Image
                    src={INSTITUCIONAL.foto.src}
                    alt={INSTITUCIONAL.foto.alt}
                    fill
                    sizes="(min-width: 1024px) 480px, 92vw"
                    className="object-cover"
                  />
                </div>
                {/* slate-600: sobre `sand` el 500 se queda en 4,32:1. */}
                <figcaption className="mt-3 text-tiny text-slate-600">
                  Sede de la UNSTA, donde se dictan los encuentros presenciales.
                </figcaption>
              </figure>
            </Reveal>
          </div>

          <div className="lg:col-span-7">
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

            {/* El botón aparece recién cuando el PDF existe: un botón
                deshabilitado con "a confirmar" al lado sólo cuenta que el sitio
                está incompleto. Al subir el archivo y poner `disponible: true`
                en el content, aparece solo. */}
            {INSTITUCIONAL.carpeta.disponible && (
              <Reveal retardo={140}>
                <div className="mt-10 flex flex-wrap items-center gap-3">
                  <a href={INSTITUCIONAL.carpeta.href} className="secondary-button" download>
                    {INSTITUCIONAL.carpeta.etiqueta}
                    <span aria-hidden="true">↓</span>
                  </a>
                </div>
              </Reveal>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
