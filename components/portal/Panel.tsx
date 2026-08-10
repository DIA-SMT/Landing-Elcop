import { formatearFecha } from "@/content/elcop";
import {
  MINIMO_ASISTENCIA,
  calcularRegularidad,
  encuentrosRecientes,
  estadoAcademico,
  proximoEncuentro
} from "@/lib/portal/calculos";
import type { DatosDelPortal, Encuentro } from "@/lib/portal/tipos";

/**
 * El panel del becario: termómetro de regularidad, estado académico, próximo
 * encuentro y clases recientes.
 *
 * Todo lo que se ve acá se calcula de los encuentros y las asistencias. No hay
 * ningún número guardado.
 */
export function Panel({ datos }: { datos: DatosDelPortal }) {
  const estado = estadoAcademico(datos);
  const proxima = proximoEncuentro(datos.encuentros);
  const recientes = encuentrosRecientes(datos.encuentros);

  return (
    <div className="flex flex-col gap-6">
      {/* Un becario que ve un 89% inventado lo va a tomar por real. Si los datos
          son de ejemplo, se dice arriba de todo y no en una nota al pie. */}
      {datos.esDemostracion && (
        <p className="flex flex-wrap items-center gap-2 rounded-2xl border border-black/5 bg-white p-4 text-sm text-slate-600 shadow-sm">
          <span className="badge-soft">
            <i className="bg-brandYellow" />
            Datos de ejemplo
          </span>
          Sirven para mostrar cómo va a verse el panel. No son tu asistencia ni tus clases.
        </p>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="flex flex-col gap-6">
          <Termometro datos={datos} />
          <ProximoEncuentro encuentro={proxima} />
          <ClasesRecientes encuentros={recientes} />
        </div>

        <EstadoAcademico estado={estado} />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function Termometro({ datos }: { datos: DatosDelPortal }) {
  const { porcentaje, presentes, computables, justificadas, esRegular } = calcularRegularidad(
    datos.encuentros,
    datos.asistencias
  );

  return (
    <section
      aria-labelledby="asistencia-titulo"
      className="rounded-[24px] border border-black/5 bg-white p-6 shadow-card md:p-8"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="asistencia-titulo" className="micro-label">
            Asistencia
          </h2>
          {porcentaje === null ? (
            <p className="mt-3 font-display text-2xl font-extrabold tracking-tight text-ink">
              Sin encuentros computados
            </p>
          ) : (
            <p className="mt-2 font-display text-5xl font-extrabold leading-none tracking-tight text-municipal-700 md:text-6xl">
              {porcentaje}
              <span className="text-3xl">%</span>
            </p>
          )}
        </div>
        <p className="text-sm text-slate-600">
          Mínimo requerido: <span className="font-bold text-ink">{MINIMO_ASISTENCIA}%</span>
        </p>
      </div>

      {porcentaje === null ? (
        <p className="mt-4 text-sm leading-relaxed text-slate-600">
          Todavía no se dictaron encuentros presenciales, así que no hay asistencia que calcular.
        </p>
      ) : (
        <>
          {/* La barra es apoyo visual: el número y el detalle de abajo dicen lo
              mismo, para no depender del color ni de la forma. */}
          <div
            aria-hidden="true"
            className="mt-6 h-2.5 w-full overflow-hidden rounded-full bg-slate-100"
          >
            <div
              className={`h-full rounded-full ${esRegular ? "bg-municipal-700" : "bg-red-600"}`}
              style={{ width: `${Math.min(porcentaje, 100)}%` }}
            />
          </div>

          <p className="mt-4 text-sm leading-relaxed text-slate-600">
            Estuviste en <span className="font-bold text-ink">{presentes}</span> de{" "}
            <span className="font-bold text-ink">{computables}</span> encuentros presenciales
            dictados.
            {justificadas > 0 && (
              <>
                {" "}
                Tenés {justificadas} {justificadas === 1 ? "ausencia" : "ausencias"} justificada
                {justificadas === 1 ? "" : "s"}, que no cuentan en el total.
              </>
            )}
          </p>

          {!esRegular && (
            <p role="alert" className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
              Estás por debajo del mínimo para mantener la regularidad. Hablá con la coordinación.
            </p>
          )}
        </>
      )}

      <p className="mt-5 text-tiny leading-relaxed text-slate-500">
        Sólo cuentan los encuentros presenciales que se dictaron. Los virtuales y los cancelados no
        suman ni restan.
      </p>
    </section>
  );
}

/* -------------------------------------------------------------------------- */

function ProximoEncuentro({ encuentro }: { encuentro: Encuentro | null }) {
  return (
    <section
      aria-labelledby="proximo-titulo"
      className="rounded-[24px] border border-black/5 bg-white p-6 shadow-card md:p-8"
    >
      <h2 id="proximo-titulo" className="micro-label">
        Próximo encuentro
      </h2>

      {!encuentro ? (
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          No hay encuentros programados por ahora. Cuando la coordinación cargue el calendario, van
          a aparecer acá.
        </p>
      ) : (
        <>
          <h3 className="mt-3 font-display text-xl font-extrabold tracking-tight text-ink">
            {encuentro.titulo}
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            {encuentro.eje} · {encuentro.modulo}
          </p>
          <dl className="mt-5 divide-y divide-slate-100 border-t border-slate-100">
            <Fila termino="Cuándo" definicion={formatearFecha(encuentro.comienza.slice(0, 10))} />
            <Fila
              termino="Modalidad"
              definicion={encuentro.modalidad === "presencial" ? "Presencial" : "Virtual"}
            />
            <Fila termino="Dónde" definicion={encuentro.lugar ?? "Por videollamada"} />
          </dl>
          {encuentro.esMasterclass && encuentro.referente && (
            <p className="mt-4">
              <span className="badge-soft px-3 py-1.5 text-tiny font-semibold normal-case">
                <i className="bg-municipal-500" />
                Masterclass · {encuentro.referente}
              </span>
            </p>
          )}
        </>
      )}
    </section>
  );
}

function Fila({ termino, definicion }: { termino: string; definicion: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-3">
      <dt className="micro-label">{termino}</dt>
      <dd className="text-right text-sm font-bold text-ink">{definicion}</dd>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function ClasesRecientes({ encuentros }: { encuentros: Encuentro[] }) {
  return (
    <section
      aria-labelledby="recientes-titulo"
      className="rounded-[24px] border border-black/5 bg-white p-6 shadow-card md:p-8"
    >
      <h2 id="recientes-titulo" className="micro-label">
        Clases recientes
      </h2>

      {encuentros.length === 0 ? (
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          Todavía no se dictó ninguna clase.
        </p>
      ) : (
        <ul className="mt-4 flex flex-col divide-y divide-slate-100 border-t border-slate-100">
          {encuentros.map((encuentro) => (
            <li key={encuentro.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3">
              <div className="min-w-0">
                <p className="font-display text-base font-bold leading-snug text-ink">
                  {encuentro.titulo}
                </p>
                <p className="mt-0.5 text-tiny text-slate-500">{encuentro.eje}</p>
              </div>
              <time dateTime={encuentro.comienza} className="text-tiny font-semibold text-slate-600">
                {formatearFecha(encuentro.comienza.slice(0, 10))}
              </time>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* -------------------------------------------------------------------------- */

const TEXTO_ENTREGA: Record<string, string> = {
  "sin-empezar": "Sin empezar",
  borrador: "En borrador",
  presentado: "Presentado",
  observado: "Con observaciones",
  aprobado: "Aprobado"
};

function EstadoAcademico({ estado }: { estado: ReturnType<typeof estadoAcademico> }) {
  const { regularidad, consultasPendientes, entrega, actasPendientes } = estado;

  return (
    <section
      aria-labelledby="estado-titulo"
      className="h-fit rounded-[24px] border border-black/5 bg-white p-6 shadow-card md:p-8"
    >
      <h2 id="estado-titulo" className="micro-label">
        Estado académico
      </h2>

      <dl className="mt-4 flex flex-col divide-y divide-slate-100 border-t border-slate-100">
        <div className="py-3">
          <dt className="text-sm text-slate-600">Condición</dt>
          <dd className="mt-1">
            <span className="badge-soft">
              <i className={regularidad.esRegular ? "bg-municipal-700" : "bg-red-600"} />
              {regularidad.esRegular ? "Regular" : "No regular"}
            </span>
          </dd>
        </div>

        <div className="py-3">
          <dt className="text-sm text-slate-600">Proyecto final</dt>
          {/* El título va adentro del `dd`, no como hermano: un `<dl>` sólo
              admite grupos de `dt` y `dd`, y un tercer elemento en el medio le
              rompe la estructura. Además el título es parte del valor. */}
          <dd className="mt-1 text-sm font-bold text-ink">
            {TEXTO_ENTREGA[entrega.estado] ?? entrega.estado}
            {entrega.titulo && (
              <p className="mt-0.5 text-tiny font-normal text-slate-500">{entrega.titulo}</p>
            )}
          </dd>
        </div>

        <div className="py-3">
          <dt className="text-sm text-slate-600">Consultas pendientes</dt>
          <dd className="mt-1 text-sm font-bold text-ink">{consultasPendientes}</dd>
        </div>

        <div className="py-3">
          <dt className="text-sm text-slate-600">Actas por aceptar</dt>
          <dd className="mt-1 text-sm font-bold text-ink">{actasPendientes}</dd>
        </div>
      </dl>
    </section>
  );
}
