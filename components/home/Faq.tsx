"use client";

import { useId, useState } from "react";

import { FAQ } from "@/content/elcop";

/**
 * Acordeón accesible escrito a mano (no `<details>`): cada pregunta es un
 * botón con `aria-expanded` y `aria-controls`, y el panel se referencia con
 * `aria-labelledby`. Se puede tener más de uno abierto a la vez.
 */
export function Faq() {
  const idBase = useId();
  const [abiertos, setAbiertos] = useState<string[]>([FAQ[0]?.id ?? ""]);

  const alternar = (id: string) =>
    setAbiertos((previos) =>
      previos.includes(id) ? previos.filter((otro) => otro !== id) : [...previos, id]
    );

  return (
    <section aria-labelledby="faq-titulo" className="section-block">
      <div className="section-heading">
        <div className="max-w-2xl">
          <p className="section-kicker">Preguntas frecuentes</p>
          <h2 id="faq-titulo">Lo que más nos consultan</h2>
        </div>
      </div>

      <div className="mx-auto max-w-3xl overflow-hidden rounded-[24px] border border-black/5 bg-white shadow-card">
        {FAQ.map((item, indice) => {
          const abierto = abiertos.includes(item.id);
          const idBoton = `${idBase}-${item.id}-boton`;
          const idPanel = `${idBase}-${item.id}-panel`;

          return (
            <div key={item.id} className={indice > 0 ? "border-t border-slate-100" : undefined}>
              <h3>
                <button
                  type="button"
                  id={idBoton}
                  aria-expanded={abierto}
                  aria-controls={idPanel}
                  onClick={() => alternar(item.id)}
                  className="flex min-h-14 w-full items-center justify-between gap-4 px-5 py-4 text-left font-display text-base font-bold text-ink transition ease-out hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-municipal-500 md:px-7 md:text-lg"
                >
                  {item.pregunta}
                  {/* Sólo rota: no anima ninguna propiedad de maqueta. */}
                  <span
                    aria-hidden="true"
                    className={`grid size-8 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-600 transition ease-out ${
                      abierto ? "rotate-45" : "rotate-0"
                    }`}
                  >
                    +
                  </span>
                </button>
              </h3>

              {abierto && (
                <div
                  id={idPanel}
                  role="region"
                  aria-labelledby={idBoton}
                  className="animate-fade-in px-5 pb-6 pr-14 md:px-7 md:pb-7 md:pr-16"
                >
                  <p className="text-sm leading-relaxed text-slate-600 md:text-base">
                    {item.respuesta}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
