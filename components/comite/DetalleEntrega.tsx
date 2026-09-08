"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";

import { SECCIONES_PROYECTO, type Entrega } from "@/lib/portal/tipos";
import {
  LIMITES_OBSERVACIONES,
  SECCIONES,
  validarObservaciones
} from "@/lib/portal/validacion-entrega";

/**
 * Lectura de un proyecto y devolución con observaciones.
 *
 * La lectura es lo principal: quien evalúa viene a leer, no a operar. Por eso el
 * proyecto va completo y arriba, y la devolución abajo — y sólo aparece si la
 * entrega está presentada, que es el único estado en que corresponde.
 */
export function DetalleEntrega({
  becarioId,
  nombre,
  entrega
}: {
  becarioId: string;
  nombre: string | null;
  entrega: Entrega;
}) {
  return (
    <div className="flex flex-col gap-6">
      <Ficha becarioId={becarioId} nombre={nombre} entrega={entrega} />
      <Proyecto entrega={entrega} />

      {/* El `aria-live` va en este contenedor, que sobrevive al cambio de
          estado, y no adentro del formulario. Al enviar la devolución el
          formulario se reemplaza por la explicación de que ya se envió: si el
          aviso viviera adentro, se desmontaría junto con él y nadie lo
          escucharía nunca. */}
      <div aria-live="polite">
        {entrega.estado === "presentado" ? (
          <Devolucion becarioId={becarioId} />
        ) : (
          <PorQueNoSePuedeDevolver entrega={entrega} />
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

const TEXTO_ESTADO: Record<Entrega["estado"], string> = {
  presentado: "Presentado, esperando respuesta",
  observado: "Devuelto con observaciones",
  borrador: "En borrador, todavía no presentado",
  aprobado: "Aprobado",
  "sin-empezar": "Sin empezar"
};

function formatearFechaHora(iso: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(iso));
}

function Ficha({
  becarioId,
  nombre,
  entrega
}: {
  becarioId: string;
  nombre: string | null;
  entrega: Entrega;
}) {
  return (
    <section
      aria-labelledby="ficha-titulo"
      className="rounded-[24px] border border-black/5 bg-white p-6 shadow-card md:p-8"
    >
      <h2 id="ficha-titulo" className="micro-label">
        Quién lo presenta
      </h2>
      <dl className="mt-4 divide-y divide-slate-100 border-t border-slate-100">
        <div className="flex items-baseline justify-between gap-4 py-3">
          <dt className="text-sm text-slate-600">Becario</dt>
          <dd className="text-right text-sm font-bold text-ink">
            {nombre ?? `Documento ${becarioId}`}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-4 py-3">
          <dt className="text-sm text-slate-600">Estado</dt>
          <dd className="text-right text-sm font-bold text-ink">{TEXTO_ESTADO[entrega.estado]}</dd>
        </div>
        {entrega.presentadoEn && (
          <div className="flex items-baseline justify-between gap-4 py-3">
            <dt className="text-sm text-slate-600">Presentado</dt>
            <dd className="text-right text-sm font-bold text-ink">
              {formatearFechaHora(entrega.presentadoEn)}
            </dd>
          </div>
        )}
      </dl>

      {entrega.observaciones && (
        <div className="mt-5 rounded-xl bg-municipal-50 p-4">
          <p className="micro-label text-municipal-900">Devolución que ya se le envió</p>
          <p className="texto-de-usuario mt-2 whitespace-pre-line text-sm leading-relaxed text-ink">
            {entrega.observaciones}
          </p>
        </div>
      )}
    </section>
  );
}

/* -------------------------------------------------------------------------- */

function Proyecto({ entrega }: { entrega: Entrega }) {
  return (
    <section
      aria-labelledby="proyecto-titulo"
      className="rounded-[24px] border border-black/5 bg-white p-6 shadow-card md:p-8"
    >
      <h2
        id="proyecto-titulo"
        className="texto-de-usuario font-display text-2xl font-extrabold leading-tight tracking-tight text-ink"
      >
        {entrega.titulo || "Sin título todavía"}
      </h2>

      <dl className="mt-6 flex flex-col gap-6">
        <div>
          <dt className="micro-label">Resumen</dt>
          <dd className="texto-de-usuario mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-600">
            {entrega.resumen || <span className="text-slate-500">Sin completar.</span>}
          </dd>
        </div>
        {SECCIONES_PROYECTO.map((seccion) => (
          <div key={seccion}>
            <dt className="micro-label">{SECCIONES[seccion].titulo}</dt>
            <dd className="texto-de-usuario mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-600">
              {entrega.secciones[seccion] || <span className="text-slate-500">Sin completar.</span>}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/* -------------------------------------------------------------------------- */

/** Por qué no hay formulario de devolución para esta entrega. */
function PorQueNoSePuedeDevolver({ entrega }: { entrega: Entrega }) {
  const motivo =
    entrega.estado === "borrador" || entrega.estado === "sin-empezar"
      ? "Todavía no está presentado, así que no corresponde devolverlo: la persona lo sigue escribiendo."
      : entrega.estado === "observado"
        ? "Ya se le envió una devolución. Va a poder volver a presentarlo con los cambios, y ahí se puede responder de nuevo."
        : "El proyecto está aprobado, así que no se devuelve.";

  return (
    <section className="rounded-[24px] border border-black/5 bg-white p-6 shadow-card md:p-8">
      <h2 className="micro-label">Devolución</h2>
      <p className="mt-3 text-sm leading-relaxed text-slate-600">{motivo}</p>
    </section>
  );
}

/* -------------------------------------------------------------------------- */

/**
 * No hay estado "enviada": cuando sale bien, este formulario se desmonta.
 *
 * Queda en "enviando" hasta que eso pase, con el botón deshabilitado. Si la
 * recarga fallara, el botón queda trabado y la persona recarga la página — que
 * es preferible a habilitarlo y que mande la misma devolución dos veces.
 */
type Estado = "editando" | "enviando" | "error";

function Devolucion({ becarioId }: { becarioId: string }) {
  const idBase = useId();
  const router = useRouter();

  const [texto, setTexto] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [estado, setEstado] = useState<Estado>("editando");

  const enviar = async (evento: React.FormEvent<HTMLFormElement>) => {
    evento.preventDefault();

    const problema = validarObservaciones(texto);
    setError(problema);
    if (problema) {
      setEstado("error");
      document.getElementById(`${idBase}-observaciones`)?.focus();
      return;
    }

    setEstado("enviando");
    try {
      const respuesta = await fetch("/api/comite/observaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ becarioId, observaciones: texto })
      });

      if (respuesta.ok) {
        // Sin tocar `estado`: sigue en "enviando" hasta que la recarga reemplace
        // este formulario por el panel que dice que la devolución ya se envió.
        router.refresh();
        return;
      }

      const cuerpo = (await respuesta.json().catch(() => null)) as {
        errores?: { observaciones?: string; general?: string };
      } | null;
      setError(cuerpo?.errores?.observaciones ?? cuerpo?.errores?.general ?? null);
      setEstado("error");
    } catch {
      setEstado("error");
    }
  };

  const usado = texto.trim().length;

  return (
    <section
      aria-labelledby="devolucion-titulo"
      className="rounded-[24px] border border-black/5 bg-white p-6 shadow-card md:p-8"
    >
      <h2
        id="devolucion-titulo"
        className="font-display text-xl font-extrabold tracking-tight text-ink"
      >
        Devolver con observaciones
      </h2>
      <p className="mt-1 text-sm leading-relaxed text-slate-600">
        Lo que escribas se le muestra en su pantalla del proyecto, y el proyecto queda a la espera
        de que lo corrija y lo vuelva a presentar.
      </p>

      <form noValidate onSubmit={enviar} className="mt-6 flex flex-col gap-5">
        <div className="form-field">
          <label htmlFor={`${idBase}-observaciones`} className="form-label">
            Observaciones
            <span className="ml-1 text-red-600" aria-hidden="true">
              *
            </span>
          </label>
          <textarea
            id={`${idBase}-observaciones`}
            name="observaciones"
            rows={6}
            value={texto}
            maxLength={LIMITES_OBSERVACIONES.maximo}
            placeholder="Qué hay que corregir, y por qué"
            onChange={(e) => {
              setTexto(e.target.value);
              if (error) setError(validarObservaciones(e.target.value));
            }}
            aria-invalid={Boolean(error)}
            aria-describedby={
              [`${idBase}-ayuda`, error ? `${idBase}-error` : null].filter(Boolean).join(" ")
            }
            className="form-control resize-y"
          />
          <p className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-tiny">
            <span id={`${idBase}-ayuda`} className="max-w-prose text-slate-600">
              Concreta: es lo único que la persona va a leer para saber qué rehacer. Entre{" "}
              {LIMITES_OBSERVACIONES.minimo} y {LIMITES_OBSERVACIONES.maximo} caracteres.
            </span>
            <span aria-hidden="true" className="tabular-nums text-slate-500">
              {usado}/{LIMITES_OBSERVACIONES.maximo}
            </span>
          </p>
          {error && (
            <p id={`${idBase}-error`} className="form-error">
              <span aria-hidden="true">⚠</span>
              {error}
            </p>
          )}
        </div>

        {/* No hay mensaje de éxito acá: cuando la devolución sale bien, este
            formulario deja de existir y su lugar lo toma el panel que dice que
            ya se envió. Un aviso de "listo" en un componente que se desmonta al
            estar listo no se ve nunca. */}
        {estado === "error" && !error && (
          <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            No pudimos enviar la devolución. Probá de nuevo en unos minutos.
          </p>
        )}

        <div className="flex justify-end">
          <button type="submit" className="primary-button" disabled={estado === "enviando"}>
            {estado === "enviando" ? "Enviando…" : "Enviar devolución"}
            {estado !== "enviando" && <span aria-hidden="true">→</span>}
          </button>
        </div>
      </form>
    </section>
  );
}
