"use client";

import { useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { proximaSesionMentoria, sesionesAbiertas } from "@/lib/portal/calculos";
import type { Consulta, SesionMentoria } from "@/lib/portal/tipos";
import { LIMITES_CONSULTA, validarConsulta, type ErroresConsulta } from "@/lib/portal/validacion-consulta";

/**
 * Mentorías: la primera pantalla del portal donde el becario escribe.
 *
 * Cubre los dos modos que definimos: una consulta puede ir dirigida a una
 * sesión programada —si su cierre de consultas no pasó— o al canal abierto,
 * que no depende de ninguna fecha.
 *
 * La validación del formulario es la misma que aplica el servidor, importada
 * del mismo módulo: acá avisa temprano, allá decide.
 */
export function Mentorias({
  consultas,
  sesiones,
  esDemostracion
}: {
  consultas: Consulta[];
  sesiones: SesionMentoria[];
  esDemostracion: boolean;
}) {
  const abiertas = sesionesAbiertas(sesiones);

  return (
    <div className="flex flex-col gap-6">
      {esDemostracion && (
        <p className="flex flex-wrap items-center gap-2 rounded-2xl border border-black/5 bg-white p-4 text-sm text-slate-600 shadow-sm">
          <span className="badge-soft">
            <i className="bg-brandYellow" />
            Datos de ejemplo
          </span>
          Las consultas y sesiones no son reales, pero el envío funciona: probalo.
        </p>
      )}

      <ProximaSesion sesiones={sesiones} />
      <FormularioConsulta abiertas={abiertas} />
      <ListaConsultas consultas={consultas} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function formatearFechaHora(iso: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(iso));
}

function ProximaSesion({ sesiones }: { sesiones: SesionMentoria[] }) {
  const proxima = proximaSesionMentoria(sesiones);

  return (
    <section
      aria-labelledby="proxima-mentoria-titulo"
      className="rounded-[24px] border border-black/5 bg-white p-6 shadow-card md:p-8"
    >
      <h2 id="proxima-mentoria-titulo" className="micro-label">
        Próxima sesión de mentoría
      </h2>

      {!proxima ? (
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          No hay sesiones programadas por ahora. Igual podés mandar tu consulta por el canal
          abierto, acá abajo.
        </p>
      ) : (
        <>
          <h3 className="mt-3 font-display text-xl font-extrabold tracking-tight text-ink">
            {proxima.titulo}
          </h3>
          {proxima.mentor && <p className="mt-1 text-sm text-slate-600">Con {proxima.mentor}</p>}
          <dl className="mt-5 divide-y divide-slate-100 border-t border-slate-100">
            <div className="flex items-baseline justify-between gap-4 py-3">
              <dt className="micro-label">Cuándo</dt>
              <dd className="text-right text-sm font-bold text-ink">
                {formatearFechaHora(proxima.comienza)}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 py-3">
              <dt className="micro-label">Consultas hasta</dt>
              <dd className="text-right text-sm font-bold text-ink">
                {formatearFechaHora(proxima.cierreDeConsultas)}
              </dd>
            </div>
          </dl>
          <p className="mt-3 text-tiny leading-relaxed text-slate-500">
            Después del cierre, quien mentorea prepara la sesión con la lista completa. Las
            consultas que lleguen tarde van al canal abierto.
          </p>
        </>
      )}
    </section>
  );
}

/* -------------------------------------------------------------------------- */

type Estado = "editando" | "enviando" | "enviada" | "error";

function FormularioConsulta({ abiertas }: { abiertas: SesionMentoria[] }) {
  const idBase = useId();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  const [asunto, setAsunto] = useState("");
  const [texto, setTexto] = useState("");
  const [sesionId, setSesionId] = useState("");
  const [errores, setErrores] = useState<ErroresConsulta>({});
  const [intentado, setIntentado] = useState(false);
  const [estado, setEstado] = useState<Estado>("editando");

  const revalidar = (nuevoAsunto: string, nuevoTexto: string) => {
    if (intentado) setErrores(validarConsulta({ asunto: nuevoAsunto, texto: nuevoTexto }));
  };

  const enviar = async (evento: React.FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    setIntentado(true);
    setEstado("editando");

    const nuevos = validarConsulta({ asunto, texto });
    setErrores(nuevos);
    if (nuevos.asunto || nuevos.texto) {
      // El foco va al primer campo con problema.
      const primero = nuevos.asunto ? "asunto" : "texto";
      formRef.current?.querySelector<HTMLElement>(`#${CSS.escape(`${idBase}-${primero}`)}`)?.focus();
      return;
    }

    setEstado("enviando");
    try {
      const respuesta = await fetch("/api/portal/consultas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ asunto, texto, sesionId: sesionId || null })
      });

      if (respuesta.ok) {
        setAsunto("");
        setTexto("");
        setSesionId("");
        setIntentado(false);
        setEstado("enviada");
        // La lista la renderiza el servidor: se le pide que la recargue.
        router.refresh();
        return;
      }

      // El servidor puede rechazar lo que el cliente no ve: una sesión que
      // cerró entre que se abrió la página y se envió, por ejemplo.
      const cuerpo = (await respuesta.json().catch(() => null)) as {
        errores?: ErroresConsulta;
      } | null;
      if (cuerpo?.errores) setErrores(cuerpo.errores);
      setEstado("error");
    } catch {
      setEstado("error");
    }
  };

  const largoTexto = texto.trim().length;

  return (
    <section
      aria-labelledby="nueva-consulta-titulo"
      className="rounded-[24px] border border-black/5 bg-white p-6 shadow-card md:p-8"
    >
      <h2 id="nueva-consulta-titulo" className="font-display text-xl font-extrabold tracking-tight text-ink">
        Mandá tu consulta
      </h2>
      <p className="mt-1 text-sm leading-relaxed text-slate-600">
        Puede ir a una sesión programada o al canal abierto, que se responde por acá.
      </p>

      <form ref={formRef} noValidate onSubmit={enviar} className="mt-6 flex flex-col gap-5">
        <div className="form-field">
          <label htmlFor={`${idBase}-sesion`} className="form-label">
            ¿Para qué sesión?
          </label>
          <select
            id={`${idBase}-sesion`}
            name="sesionId"
            value={sesionId}
            onChange={(e) => setSesionId(e.target.value)}
            aria-invalid={Boolean(errores.sesionId)}
            aria-describedby={errores.sesionId ? `${idBase}-sesion-error` : undefined}
            className="form-control"
          >
            <option value="">Canal abierto (sin sesión)</option>
            {abiertas.map((sesion) => (
              <option key={sesion.id} value={sesion.id}>
                {sesion.titulo} — consultas hasta el {formatearFechaHora(sesion.cierreDeConsultas)}
              </option>
            ))}
          </select>
          {errores.sesionId && (
            <p id={`${idBase}-sesion-error`} className="form-error">
              <span aria-hidden="true">⚠</span>
              {errores.sesionId}
            </p>
          )}
        </div>

        <div className="form-field">
          <label htmlFor={`${idBase}-asunto`} className="form-label">
            Asunto
            <span className="ml-1 text-red-600" aria-hidden="true">*</span>
          </label>
          <input
            id={`${idBase}-asunto`}
            name="asunto"
            type="text"
            value={asunto}
            maxLength={LIMITES_CONSULTA.asunto.maximo}
            placeholder="En una línea, de qué se trata"
            onChange={(e) => {
              setAsunto(e.target.value);
              revalidar(e.target.value, texto);
            }}
            aria-invalid={Boolean(errores.asunto)}
            aria-describedby={errores.asunto ? `${idBase}-asunto-error` : undefined}
            className="form-control"
          />
          {errores.asunto && (
            <p id={`${idBase}-asunto-error`} className="form-error">
              <span aria-hidden="true">⚠</span>
              {errores.asunto}
            </p>
          )}
        </div>

        <div className="form-field">
          <label htmlFor={`${idBase}-texto`} className="form-label">
            Tu consulta
            <span className="ml-1 text-red-600" aria-hidden="true">*</span>
          </label>
          <textarea
            id={`${idBase}-texto`}
            name="texto"
            rows={5}
            value={texto}
            maxLength={LIMITES_CONSULTA.texto.maximo}
            placeholder="Cuanto más concreta, mejor la respuesta"
            onChange={(e) => {
              setTexto(e.target.value);
              revalidar(asunto, e.target.value);
            }}
            aria-invalid={Boolean(errores.texto)}
            aria-describedby={
              [`${idBase}-texto-ayuda`, errores.texto ? `${idBase}-texto-error` : null]
                .filter(Boolean)
                .join(" ")
            }
            className="form-control resize-y"
          />
          <p className="flex items-center justify-between gap-2 text-tiny">
            <span id={`${idBase}-texto-ayuda`} className="text-slate-500">
              Entre {LIMITES_CONSULTA.texto.minimo} y {LIMITES_CONSULTA.texto.maximo} caracteres.
            </span>
            <span aria-hidden="true" className="tabular-nums text-slate-500">
              {largoTexto}/{LIMITES_CONSULTA.texto.maximo}
            </span>
          </p>
          {errores.texto && (
            <p id={`${idBase}-texto-error`} className="form-error">
              <span aria-hidden="true">⚠</span>
              {errores.texto}
            </p>
          )}
        </div>

        <div aria-live="polite">
          {estado === "enviada" && (
            <p className="rounded-2xl border border-municipal-500/25 bg-municipal-50 p-4 text-sm font-semibold text-municipal-900">
              Consulta enviada. Ya aparece en tu lista, acá abajo.
            </p>
          )}
          {estado === "error" && !errores.sesionId && (
            <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
              No pudimos enviar la consulta. Probá de nuevo en unos minutos.
            </p>
          )}
        </div>

        <div className="flex justify-end">
          <button type="submit" className="primary-button" disabled={estado === "enviando"}>
            {estado === "enviando" ? "Enviando…" : "Enviar consulta"}
            {estado !== "enviando" && <span aria-hidden="true">→</span>}
          </button>
        </div>
      </form>
    </section>
  );
}

/* -------------------------------------------------------------------------- */

const ESTILO_ESTADO: Record<Consulta["estado"], { color: string; texto: string }> = {
  pendiente: { color: "bg-brandYellow", texto: "Pendiente" },
  respondida: { color: "bg-municipal-700", texto: "Respondida" },
  cerrada: { color: "bg-slate-400", texto: "Cerrada" }
};

function ListaConsultas({ consultas }: { consultas: Consulta[] }) {
  return (
    <section
      aria-labelledby="mis-consultas-titulo"
      className="rounded-[24px] border border-black/5 bg-white p-6 shadow-card md:p-8"
    >
      <h2 id="mis-consultas-titulo" className="font-display text-xl font-extrabold tracking-tight text-ink">
        Tus consultas
      </h2>

      {consultas.length === 0 ? (
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          Todavía no mandaste ninguna. La primera que envíes va a aparecer acá, con su estado y su
          respuesta.
        </p>
      ) : (
        <ul className="mt-5 flex flex-col gap-4">
          {consultas.map((consulta) => {
            const estilo = ESTILO_ESTADO[consulta.estado];
            return (
              <li key={consulta.id}>
                <article className="rounded-2xl border border-slate-100 p-4 md:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                    <div className="min-w-0">
                      <h3 className="font-display text-base font-bold leading-snug text-ink">
                        {consulta.asunto}
                      </h3>
                      <p className="mt-1 text-tiny text-slate-600">
                        {formatearFechaHora(consulta.creadaEn)}
                        {" · "}
                        {consulta.sesion ?? "Canal abierto"}
                      </p>
                    </div>
                    <span className="badge-soft">
                      <i className={estilo.color} />
                      {estilo.texto}
                    </span>
                  </div>

                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{consulta.texto}</p>

                  {consulta.respuesta && (
                    <div className="mt-4 rounded-xl bg-municipal-50 p-4">
                      <p className="micro-label text-municipal-900">Respuesta</p>
                      <p className="mt-2 text-sm leading-relaxed text-ink">{consulta.respuesta}</p>
                      {consulta.respondidaEn && (
                        <p className="mt-2 text-tiny text-slate-600">
                          {formatearFechaHora(consulta.respondidaEn)}
                        </p>
                      )}
                    </div>
                  )}
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
