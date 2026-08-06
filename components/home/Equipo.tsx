import Image from "next/image";

import { EQUIPO, iniciales, type IntegranteEquipo } from "@/content/elcop";
import { Reveal } from "@/components/ui/Reveal";

export function Equipo() {
  return (
    <section aria-labelledby="equipo-titulo" className="section-block">
      <div className="section-heading">
        <div>
          <p className="section-kicker">Nuestro equipo</p>
          <h2 id="equipo-titulo">Quiénes dirigen y sostienen la Escuela</h2>
          <p>Dirección institucional, coordinación académica y coordinación administrativa.</p>
        </div>
      </div>

      <div className="flex flex-col gap-10">
        {EQUIPO.map((grupo, indiceGrupo) => (
          <Reveal key={grupo.id} retardo={indiceGrupo * 70}>
            <article className="rounded-[24px] border border-black/5 bg-white p-6 shadow-card md:p-8">
              <div className="flex flex-col gap-1 border-b border-slate-100 pb-5">
                <h3 className="font-display text-xl font-extrabold tracking-tight text-ink">
                  {grupo.titulo}
                </h3>
                <p className="text-sm text-slate-500">{grupo.descripcion}</p>
              </div>

              <ul className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {grupo.integrantes.map((integrante) => (
                  <li key={integrante.nombre}>
                    <FichaIntegrante integrante={integrante} />
                  </li>
                ))}
              </ul>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function FichaIntegrante({ integrante }: { integrante: IntegranteEquipo }) {
  return (
    <div className="flex items-center gap-4">
      {/* Mientras no haya foto real se muestran las iniciales sobre `sand`.
          El espacio reservado es el mismo, así que sumar la foto no mueve
          la maqueta. */}
      {integrante.foto ? (
        <Image
          src={integrante.foto}
          alt={`${integrante.tratamiento} ${integrante.nombre}`}
          width={64}
          height={64}
          sizes="64px"
          className="size-16 shrink-0 rounded-2xl object-cover"
        />
      ) : (
        <span
          aria-hidden="true"
          // municipal-900 y no 700: sobre `sand`, el 700 se queda en 4,39:1.
          className="grid size-16 shrink-0 place-items-center rounded-2xl bg-sand font-display text-lg font-extrabold tracking-tight text-municipal-900"
        >
          {iniciales(integrante.nombre)}
        </span>
      )}

      <div className="min-w-0">
        <p className="micro-label">{integrante.tratamiento}</p>
        <p className="mt-0.5 font-display text-base font-bold leading-snug text-ink">
          {integrante.nombre}
        </p>
      </div>
    </div>
  );
}
