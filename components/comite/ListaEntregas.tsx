import Link from "next/link";

import { avanceDeEntrega } from "@/lib/portal/validacion-entrega";
import type { EntregaDeCohorte } from "@/lib/portal/datos";
import type { Entrega } from "@/lib/portal/tipos";

/**
 * Listado de entregas de la cohorte.
 *
 * El orden lo pone la capa de datos y no es alfabético: primero lo que espera
 * respuesta del comité, porque es a lo que vienen. Un listado ordenado por
 * nombre obliga a recorrerlo entero para encontrar qué hay que hacer.
 */

const ESTILO_ESTADO: Record<Entrega["estado"], { color: string; texto: string }> = {
  presentado: { color: "bg-municipal-700", texto: "Para revisar" },
  observado: { color: "bg-brandYellow", texto: "Devuelta" },
  borrador: { color: "bg-slate-400", texto: "En borrador" },
  aprobado: { color: "bg-municipal-700", texto: "Aprobada" },
  "sin-empezar": { color: "bg-slate-400", texto: "Sin empezar" }
};

function formatearFecha(iso: string): string {
  return new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "long" }).format(new Date(iso));
}

export function ListaEntregas({
  entregas,
  esDemostracion
}: {
  entregas: EntregaDeCohorte[];
  esDemostracion: boolean;
}) {
  const paraRevisar = entregas.filter((e) => e.entrega.estado === "presentado").length;

  return (
    <div className="flex flex-col gap-6">
      {esDemostracion && (
        <p className="flex flex-wrap items-center gap-2 rounded-2xl border border-black/5 bg-white p-4 text-sm text-slate-600 shadow-sm">
          <span className="badge-soft">
            <i className="bg-brandYellow" />
            Datos de ejemplo
          </span>
          Estos proyectos no son reales, pero devolver observaciones funciona: probalo.
        </p>
      )}

      <section
        aria-labelledby="resumen-comite-titulo"
        className="rounded-[24px] border border-black/5 bg-white p-6 shadow-card md:p-8"
      >
        <h2 id="resumen-comite-titulo" className="micro-label">
          Estado de la cohorte
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          {entregas.length === 0
            ? "Todavía no hay ningún proyecto cargado."
            : paraRevisar === 0
              ? `${entregas.length} proyectos en total. Ninguno espera respuesta del comité en este momento.`
              : `${entregas.length} proyectos en total, y ${paraRevisar} ${paraRevisar === 1 ? "espera" : "esperan"} respuesta del comité.`}
        </p>
      </section>

      {entregas.length > 0 && (
        <section aria-labelledby="entregas-titulo">
          <h2 id="entregas-titulo" className="sr-only">
            Proyectos de la cohorte
          </h2>
          <ul className="flex flex-col gap-4">
            {entregas.map(({ becarioId, nombre, entrega }) => {
              const estilo = ESTILO_ESTADO[entrega.estado];
              const avance = avanceDeEntrega({
                titulo: entrega.titulo ?? "",
                resumen: entrega.resumen ?? "",
                secciones: entrega.secciones
              });

              return (
                <li key={becarioId}>
                  <article className="rounded-[24px] border border-black/5 bg-white p-5 shadow-card md:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
                      <div className="min-w-0">
                        <h3 className="font-display text-lg font-bold leading-snug text-ink">
                          {entrega.titulo || "Sin título todavía"}
                        </h3>
                        <p className="mt-1 text-tiny text-slate-600">
                          {/* Sin nombre se muestra el documento: es lo único que
                              hay hasta que exista la base de becarios. */}
                          {nombre ?? `Documento ${becarioId}`}
                          {entrega.presentadoEn && ` · presentado el ${formatearFecha(entrega.presentadoEn)}`}
                          {!entrega.presentadoEn && entrega.guardadaEn &&
                            ` · última edición el ${formatearFecha(entrega.guardadaEn)}`}
                        </p>
                      </div>
                      <span className="badge-soft">
                        <i className={estilo.color} />
                        {estilo.texto}
                      </span>
                    </div>

                    {entrega.resumen && (
                      <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-600">
                        {entrega.resumen}
                      </p>
                    )}

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
                      <p className="text-tiny text-slate-600">
                        <span className="tabular-nums font-bold text-ink">
                          {avance.completas}/{avance.total}
                        </span>{" "}
                        partes completas
                      </p>
                      <Link
                        href={`/comite/${encodeURIComponent(becarioId)}`}
                        className="secondary-button"
                      >
                        Leer el proyecto
                        <span aria-hidden="true">→</span>
                      </Link>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
