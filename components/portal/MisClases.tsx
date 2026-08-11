"use client";

import { useId, useState } from "react";

import { formatearRangoDeFechas } from "@/content/elcop";
import { asistenciaDe } from "@/lib/portal/calculos";
import type { ModuloAgrupado } from "@/lib/portal/calculos";
import type { Asistencia, Encuentro, Material } from "@/lib/portal/tipos";

/**
 * El repositorio de clases, agrupado por módulo como pide el documento de
 * ELCOP.
 *
 * Cada módulo es una sección que se abre y cierra. El primero arranca abierto
 * —es el que se está cursando— y el resto cerrados: con cuatro ejes y varios
 * módulos cada uno, mostrar todo desplegado obliga a scrollear mucho para
 * llegar a lo de esta semana.
 *
 * El acordeón está escrito a mano y no con `<details>`: cada encabezado es un
 * botón con `aria-expanded` y `aria-controls`, y el panel se referencia con
 * `aria-labelledby`.
 */
export function MisClases({
  modulos,
  asistencias,
  esDemostracion
}: {
  modulos: ModuloAgrupado[];
  asistencias: Asistencia[];
  esDemostracion: boolean;
}) {
  const idBase = useId();
  const [abiertos, setAbiertos] = useState<string[]>(modulos[0] ? [modulos[0].modulo] : []);

  const alternar = (modulo: string) =>
    setAbiertos((previos) =>
      previos.includes(modulo) ? previos.filter((otro) => otro !== modulo) : [...previos, modulo]
    );

  if (modulos.length === 0) {
    return (
      <div className="rounded-[24px] border border-black/5 bg-white p-6 shadow-card md:p-8">
        <h2 className="font-display text-xl font-extrabold tracking-tight text-ink">
          Todavía no hay clases
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Cuando la coordinación cargue el calendario y los materiales, van a aparecer acá agrupados
          por módulo.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {esDemostracion && (
        <p className="flex flex-wrap items-center gap-2 rounded-2xl border border-black/5 bg-white p-4 text-sm text-slate-600 shadow-sm">
          <span className="badge-soft">
            <i className="bg-brandYellow" />
            Datos de ejemplo
          </span>
          No son tus clases ni tu asistencia.
        </p>
      )}

      <div className="flex flex-col gap-4">
        {modulos.map((grupo, indice) => {
          const abierto = abiertos.includes(grupo.modulo);
          // El id va por posición y no por nombre de módulo: los nombres tienen
          // espacios, y `aria-controls` es una lista de ids separada por
          // espacios. "La máquina del Estado" se leía como cuatro referencias
          // inexistentes, y el acordeón quedaba sin relación programática.
          const idBoton = `${idBase}-${indice}-boton`;
          const idPanel = `${idBase}-${indice}-panel`;

          return (
            <section
              key={grupo.modulo}
              className="overflow-hidden rounded-[24px] border border-black/5 bg-white shadow-card"
            >
              <h2>
                <button
                  type="button"
                  id={idBoton}
                  aria-expanded={abierto}
                  aria-controls={idPanel}
                  onClick={() => alternar(grupo.modulo)}
                  className="flex min-h-14 w-full items-center justify-between gap-4 px-5 py-4 text-left transition ease-out hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-municipal-500 md:px-7"
                >
                  <span className="min-w-0">
                    <span className="block font-display text-lg font-extrabold tracking-tight text-ink">
                      {grupo.modulo}
                    </span>
                    <span className="mt-0.5 block text-tiny text-slate-600">
                      {grupo.eje ? `${grupo.eje} · ` : ""}
                      {grupo.encuentros.length}{" "}
                      {grupo.encuentros.length === 1 ? "encuentro" : "encuentros"}
                    </span>
                  </span>
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
              </h2>

              {abierto && (
                <div
                  id={idPanel}
                  role="region"
                  aria-labelledby={idBoton}
                  className="animate-fade-in border-t border-slate-100 px-5 py-5 md:px-7 md:py-6"
                >
                  {grupo.materialesDelModulo.length > 0 && (
                    <div className="mb-6">
                      <h3 className="micro-label">Material del módulo</h3>
                      <ListaDeMateriales materiales={grupo.materialesDelModulo} />
                    </div>
                  )}

                  <ul className="flex flex-col gap-5">
                    {grupo.encuentros.map((encuentro) => (
                      <li key={encuentro.id}>
                        <FilaEncuentro
                          encuentro={encuentro}
                          asistencia={asistenciaDe(encuentro.id, asistencias)}
                          materiales={grupo.materialesPorEncuentro[encuentro.id] ?? []}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function FilaEncuentro({
  encuentro,
  asistencia,
  materiales
}: {
  encuentro: Encuentro;
  asistencia: Asistencia | null;
  materiales: Material[];
}) {
  return (
    <article className="rounded-2xl border border-slate-100 p-4 md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <h3 className="font-display text-base font-bold leading-snug text-ink">
            {encuentro.titulo}
          </h3>
          <p className="mt-1 text-tiny text-slate-600">
            {/* Las clases de comisión se dictaron jueves y viernes: el rango
                muestra los dos días como el documento oficial los lista. */}
            <time dateTime={encuentro.comienza}>
              {formatearRangoDeFechas(encuentro.comienza, encuentro.termina)}
            </time>
            {" · "}
            {encuentro.modalidad === "presencial" ? "Presencial" : "Virtual"}
            {encuentro.lugar ? ` · ${encuentro.lugar}` : ""}
            {encuentro.docente ? ` · ${encuentro.docente}` : ""}
          </p>
        </div>
        <EtiquetaAsistencia encuentro={encuentro} asistencia={asistencia} />
      </div>

      {encuentro.esMasterclass && encuentro.referente && (
        <p className="mt-3">
          <span className="badge-soft px-3 py-1.5 text-tiny font-semibold normal-case">
            <i className="bg-municipal-500" />
            Masterclass · {encuentro.referente}
          </span>
        </p>
      )}

      {materiales.length > 0 ? (
        <ListaDeMateriales materiales={materiales} />
      ) : (
        encuentro.estado === "dictado" && (
          <p className="mt-3 text-tiny text-slate-600">
            Sin material cargado para este encuentro.
          </p>
        )
      )}
    </article>
  );
}

/* -------------------------------------------------------------------------- */

/**
 * El estado de asistencia de un encuentro.
 *
 * Los que no computan lo dicen, en vez de mostrarse en blanco: que un
 * encuentro virtual no aparezca con asistencia no es un error del sistema, y
 * conviene que se entienda.
 */
function EtiquetaAsistencia({
  encuentro,
  asistencia
}: {
  encuentro: Encuentro;
  asistencia: Asistencia | null;
}) {
  if (encuentro.estado === "cancelado") {
    return (
      <span className="badge-soft">
        <i className="bg-slate-400" />
        Cancelado
      </span>
    );
  }

  if (encuentro.estado === "programado") {
    return (
      <span className="badge-soft">
        <i className="bg-municipal-500" />
        Programado
      </span>
    );
  }

  if (encuentro.modalidad === "virtual") {
    return (
      <span className="badge-soft">
        <i className="bg-slate-400" />
        No computa
      </span>
    );
  }

  if (!asistencia) {
    return (
      <span className="badge-soft">
        <i className="bg-slate-400" />
        Sin registrar
      </span>
    );
  }

  const estilos = {
    presente: { color: "bg-municipal-700", texto: "Presente" },
    ausente: { color: "bg-red-600", texto: "Ausente" },
    justificada: { color: "bg-brandYellow", texto: "Justificada" }
  }[asistencia.estado];

  return (
    <span className="badge-soft">
      <i className={estilos.color} />
      {estilos.texto}
    </span>
  );
}

/* -------------------------------------------------------------------------- */

const NOMBRE_TIPO: Record<Material["tipo"], string> = {
  presentacion: "Presentación",
  lectura: "Lectura",
  bibliografia: "Bibliografía",
  otro: "Material"
};

function ListaDeMateriales({ materiales }: { materiales: Material[] }) {
  return (
    <ul className="mt-3 flex flex-col gap-2">
      {materiales.map((material) => (
        <li key={material.id}>
          <a
            href={material.archivo}
            download
            className="flex min-h-11 items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 text-sm font-semibold text-ink transition ease-out hover:bg-municipal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-municipal-500 focus-visible:ring-offset-2"
          >
            <span className="min-w-0 py-2">
              <span className="block leading-snug">{material.titulo}</span>
              <span className="mt-0.5 block text-tiny font-normal text-slate-600">
                {NOMBRE_TIPO[material.tipo]}
                {material.descripcion ? ` · ${material.descripcion}` : ""}
              </span>
            </span>
            <span aria-hidden="true" className="shrink-0 text-municipal-700">
              ↓
            </span>
            <span className="sr-only">(descargar)</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
