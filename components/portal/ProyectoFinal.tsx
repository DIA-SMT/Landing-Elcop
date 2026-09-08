"use client";

import { useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { diasHastaLimite, entregaAbierta } from "@/lib/portal/calculos";
import { SECCIONES_PROYECTO, type Entrega } from "@/lib/portal/tipos";
import {
  LIMITES_ENTREGA,
  SECCIONES,
  avanceDeEntrega,
  borradorVacio,
  hayErrores,
  validarBorrador,
  validarPresentacion,
  type BorradorEntrega,
  type CampoEntrega,
  type ErroresEntrega
} from "@/lib/portal/validacion-entrega";

/**
 * Proyecto final: el formulario estructurado de la entrega.
 *
 * Dos acciones, y la diferencia es todo el diseño de la pantalla. **Guardar
 * borrador** no exige nada completo, porque nadie escribe cinco secciones de una
 * sentada. **Presentar** exige todo, porque después se evalúa.
 *
 * La validación es la misma que aplica el servidor, importada del mismo módulo:
 * acá avisa temprano, allá decide.
 */
export function ProyectoFinal({
  entrega,
  fechaLimite,
  esDemostracion
}: {
  entrega: Entrega;
  fechaLimite: string | null;
  esDemostracion: boolean;
}) {
  const abierta = entregaAbierta(entrega, fechaLimite);

  return (
    <div className="flex flex-col gap-6">
      {esDemostracion && entrega.estado !== "sin-empezar" && (
        <p className="flex flex-wrap items-center gap-2 rounded-2xl border border-black/5 bg-white p-4 text-sm text-slate-600 shadow-sm">
          <span className="badge-soft">
            <i className="bg-brandYellow" />
            Datos de ejemplo
          </span>
          Este borrador no es tuyo, pero si escribís y guardás, lo que quede es lo tuyo.
        </p>
      )}

      <Encabezado entrega={entrega} fechaLimite={fechaLimite} />
      {abierta ? (
        <Formulario entrega={entrega} />
      ) : (
        <SoloLectura entrega={entrega} fechaLimite={fechaLimite} />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

const ESTILO_ESTADO: Record<Entrega["estado"], { color: string; texto: string }> = {
  "sin-empezar": { color: "bg-slate-400", texto: "Sin empezar" },
  borrador: { color: "bg-brandYellow", texto: "Borrador" },
  presentado: { color: "bg-municipal-700", texto: "Presentado" },
  observado: { color: "bg-red-600", texto: "Con observaciones" },
  aprobado: { color: "bg-municipal-700", texto: "Aprobado" }
};

function formatearFechaHora(iso: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(iso));
}

function Encabezado({ entrega, fechaLimite }: { entrega: Entrega; fechaLimite: string | null }) {
  const estilo = ESTILO_ESTADO[entrega.estado];
  const dias = diasHastaLimite(fechaLimite);

  return (
    <section
      aria-labelledby="estado-entrega-titulo"
      className="rounded-[24px] border border-black/5 bg-white p-6 shadow-card md:p-8"
    >
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div>
          <h2 id="estado-entrega-titulo" className="micro-label">
            Tu proyecto final
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Se entrega en secciones y no como archivo: así ochenta proyectos se pueden leer y
            comparar en las mismas categorías.
          </p>
        </div>
        <span className="badge-soft">
          <i className={estilo.color} />
          {estilo.texto}
        </span>
      </div>

      <dl className="mt-6 divide-y divide-slate-100 border-t border-slate-100">
        <div className="flex items-baseline justify-between gap-4 py-3">
          <dt className="text-sm text-slate-600">Fecha límite</dt>
          <dd className="text-right text-sm font-bold text-ink">
            {!fechaLimite ? (
              <span className="badge-soft">
                <i className="bg-brandYellow" />A confirmar
              </span>
            ) : (
              <>
                {formatearFechaHora(fechaLimite)}
                {dias !== null && (
                  <span className="ml-2 font-normal text-slate-600">
                    {dias > 0 ? `(faltan ${dias} días)` : "(ya pasó)"}
                  </span>
                )}
              </>
            )}
          </dd>
        </div>
        {entrega.guardadaEn && (
          <div className="flex items-baseline justify-between gap-4 py-3">
            <dt className="text-sm text-slate-600">Guardado por última vez</dt>
            <dd className="text-right text-sm font-bold text-ink">
              {formatearFechaHora(entrega.guardadaEn)}
            </dd>
          </div>
        )}
        {entrega.presentadoEn && (
          <div className="flex items-baseline justify-between gap-4 py-3">
            {/* Si volvió a borrador, decir "Presentado" al lado del estado
                "Borrador" se contradice. Es una fecha del historial. */}
            <dt className="text-sm text-slate-600">
              {entrega.estado === "borrador" ? "Se presentó una vez" : "Presentado"}
            </dt>
            <dd className="text-right text-sm font-bold text-ink">
              {formatearFechaHora(entrega.presentadoEn)}
            </dd>
          </div>
        )}
      </dl>

      {!fechaLimite && (
        <p className="mt-3 text-tiny leading-relaxed text-slate-500">
          Todavía no hay fecha confirmada por ELCOP. Cuando la haya, va a aparecer acá y el
          formulario se cierra solo al vencer.
        </p>
      )}

      {entrega.observaciones && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="micro-label text-red-700">Observaciones del comité</p>
          <p className="texto-de-usuario mt-2 text-sm leading-relaxed text-ink">{entrega.observaciones}</p>
        </div>
      )}
    </section>
  );
}

/* -------------------------------------------------------------------------- */

type Estado = "editando" | "guardando" | "presentando" | "guardado" | "presentado" | "error";

function desdeEntrega(entrega: Entrega): BorradorEntrega {
  const vacio = borradorVacio();
  return {
    titulo: entrega.titulo ?? "",
    resumen: entrega.resumen ?? "",
    secciones: { ...vacio.secciones, ...entrega.secciones }
  };
}

function Formulario({ entrega }: { entrega: Entrega }) {
  const idBase = useId();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  const [datos, setDatos] = useState<BorradorEntrega>(() => desdeEntrega(entrega));
  const [errores, setErrores] = useState<ErroresEntrega>({});
  const [intentado, setIntentado] = useState(false);
  const [estado, setEstado] = useState<Estado>("editando");

  const avance = avanceDeEntrega(datos);
  const trabajando = estado === "guardando" || estado === "presentando";

  const actualizar = (cambio: Partial<BorradorEntrega>) => {
    const nuevos = { ...datos, ...cambio };
    setDatos(nuevos);
    // Revalidar mientras se escribe sólo después del primer intento: antes,
    // marcar en rojo lo que todavía se está escribiendo es hostigar.
    if (intentado) setErrores(validarPresentacion(nuevos));
    if (estado === "guardado" || estado === "presentado") setEstado("editando");
  };

  const enfocarPrimerError = (encontrados: ErroresEntrega) => {
    const orden: CampoEntrega[] = ["titulo", "resumen", ...SECCIONES_PROYECTO];
    const primero = orden.find((campo) => encontrados[campo]);
    if (!primero) return;
    formRef.current
      ?.querySelector<HTMLElement>(`#${CSS.escape(`${idBase}-${primero}`)}`)
      ?.focus();
  };

  const enviar = async (presentar: boolean) => {
    setIntentado(presentar);
    const encontrados = presentar ? validarPresentacion(datos) : validarBorrador(datos);
    setErrores(encontrados);

    if (hayErrores(encontrados)) {
      setEstado("error");
      enfocarPrimerError(encontrados);
      return;
    }

    setEstado(presentar ? "presentando" : "guardando");
    try {
      const respuesta = await fetch("/api/portal/entrega", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...datos, presentar })
      });

      if (respuesta.ok) {
        setErrores({});
        setIntentado(false);
        setEstado(presentar ? "presentado" : "guardado");
        router.refresh();
        return;
      }

      // El servidor puede rechazar lo que el cliente no ve: una fecha límite que
      // venció entre que se abrió la página y se envió, por ejemplo.
      const cuerpo = (await respuesta.json().catch(() => null)) as {
        errores?: ErroresEntrega;
      } | null;
      if (cuerpo?.errores) {
        setErrores(cuerpo.errores);
        enfocarPrimerError(cuerpo.errores);
      }
      setEstado("error");
    } catch {
      setEstado("error");
    }
  };

  return (
    <form
      ref={formRef}
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        void enviar(true);
      }}
      className="flex flex-col gap-6"
    >
      <section
        aria-labelledby="datos-proyecto-titulo"
        className="rounded-[24px] border border-black/5 bg-white p-6 shadow-card md:p-8"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2
            id="datos-proyecto-titulo"
            className="font-display text-xl font-extrabold tracking-tight text-ink"
          >
            El proyecto
          </h2>
          <p className="text-tiny text-slate-600">
            <span className="tabular-nums font-bold text-ink">
              {avance.completas}/{avance.total}
            </span>{" "}
            partes completas
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-5">
          <Campo
            id={`${idBase}-titulo`}
            etiqueta="Título del proyecto"
            ayuda="Una línea que diga qué es. Es lo que aparece en el listado del comité."
            valor={datos.titulo}
            error={errores.titulo}
            limites={LIMITES_ENTREGA.titulo}
            onChange={(titulo) => actualizar({ titulo })}
          />
          <Campo
            id={`${idBase}-resumen`}
            etiqueta="Resumen"
            ayuda="La síntesis del proyecto entero, para quien lo lee por primera vez."
            valor={datos.resumen}
            error={errores.resumen}
            limites={LIMITES_ENTREGA.resumen}
            filas={5}
            onChange={(resumen) => actualizar({ resumen })}
          />
        </div>
      </section>

      {SECCIONES_PROYECTO.map((seccion) => (
        <section
          key={seccion}
          aria-labelledby={`${idBase}-${seccion}-titulo`}
          className="rounded-[24px] border border-black/5 bg-white p-6 shadow-card md:p-8"
        >
          <h2
            id={`${idBase}-${seccion}-titulo`}
            className="font-display text-xl font-extrabold tracking-tight text-ink"
          >
            {SECCIONES[seccion].titulo}
          </h2>
          <div className="mt-5">
            <Campo
              id={`${idBase}-${seccion}`}
              etiqueta={SECCIONES[seccion].titulo}
              etiquetaOculta
              ayuda={SECCIONES[seccion].ayuda}
              valor={datos.secciones[seccion]}
              error={errores[seccion]}
              limites={LIMITES_ENTREGA.seccion}
              filas={8}
              onChange={(texto) =>
                actualizar({ secciones: { ...datos.secciones, [seccion]: texto } })
              }
            />
          </div>
        </section>
      ))}

      <div aria-live="polite">
        {estado === "guardado" && (
          <p className="rounded-2xl border border-municipal-500/25 bg-municipal-50 p-4 text-sm font-semibold text-municipal-900">
            Borrador guardado. Podés seguir en otro momento.
          </p>
        )}
        {estado === "presentado" && (
          <p className="rounded-2xl border border-municipal-500/25 bg-municipal-50 p-4 text-sm font-semibold text-municipal-900">
            Proyecto presentado. Vas a poder ver acá las observaciones del comité.
          </p>
        )}
        {estado === "error" && (
          <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {errores.general ??
              (hayErrores(errores)
                ? "Revisá lo que está marcado más arriba."
                : "No pudimos guardar. Probá de nuevo en unos minutos.")}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        {/* Guardar es `button` y no `submit`: el submit del formulario presenta,
            y confundirlos haría que un Enter en un campo presente sin querer. */}
        <button
          type="button"
          className="secondary-button justify-center"
          disabled={trabajando}
          onClick={() => void enviar(false)}
        >
          {estado === "guardando" ? "Guardando…" : "Guardar borrador"}
        </button>
        <button type="submit" className="primary-button justify-center" disabled={trabajando}>
          {estado === "presentando" ? "Presentando…" : "Presentar proyecto"}
          {!trabajando && <span aria-hidden="true">→</span>}
        </button>
      </div>

      {/* Se guarda una sola versión, así que guardar un borrador después de
          presentar reemplaza lo presentado. Decir que "se evalúa la última
          versión presentada" sería prometer un historial que no existe. */}
      <p className="text-tiny leading-relaxed text-slate-500">
        Presentar no cierra la puerta: mientras no venza la fecha límite podés volver a editar.
        Ojo que si editás y guardás como borrador, tu proyecto vuelve a estar sin presentar y hay
        que presentarlo de nuevo.
      </p>
    </form>
  );
}

/* -------------------------------------------------------------------------- */

function Campo({
  id,
  etiqueta,
  etiquetaOculta = false,
  ayuda,
  valor,
  error,
  limites,
  filas,
  onChange
}: {
  id: string;
  etiqueta: string;
  etiquetaOculta?: boolean;
  ayuda: string;
  valor: string;
  error?: string;
  limites: { minimo: number; maximo: number };
  filas?: number;
  onChange: (valor: string) => void;
}) {
  const idAyuda = `${id}-ayuda`;
  const idError = `${id}-error`;
  const usado = valor.trim().length;

  const comunes = {
    id,
    value: valor,
    maxLength: limites.maximo,
    "aria-invalid": Boolean(error),
    "aria-describedby": [idAyuda, error ? idError : null].filter(Boolean).join(" "),
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange(e.target.value)
  };

  return (
    <div className="form-field">
      <label htmlFor={id} className={etiquetaOculta ? "sr-only" : "form-label"}>
        {etiqueta}
      </label>
      {filas ? (
        <textarea {...comunes} rows={filas} className="form-control resize-y" />
      ) : (
        <input {...comunes} type="text" className="form-control" />
      )}
      <p className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-tiny">
        <span id={idAyuda} className="max-w-prose text-slate-600">
          {ayuda} Entre {limites.minimo} y {limites.maximo} caracteres.
        </span>
        <span aria-hidden="true" className="tabular-nums text-slate-500">
          {usado}/{limites.maximo}
        </span>
      </p>
      {error && (
        <p id={idError} className="form-error">
          <span aria-hidden="true">⚠</span>
          {error}
        </p>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

/** Lo que se ve cuando ya no se puede editar: aprobada, o fecha vencida. */
function SoloLectura({ entrega, fechaLimite }: { entrega: Entrega; fechaLimite: string | null }) {
  const datos = desdeEntrega(entrega);
  const cerradaPorFecha = entrega.estado !== "aprobado" && fechaLimite !== null;

  return (
    <section
      aria-labelledby="entrega-cerrada-titulo"
      className="rounded-[24px] border border-black/5 bg-white p-6 shadow-card md:p-8"
    >
      <h2
        id="entrega-cerrada-titulo"
        className="font-display text-xl font-extrabold tracking-tight text-ink"
      >
        {cerradaPorFecha ? "La entrega está cerrada" : "Tu proyecto aprobado"}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        {cerradaPorFecha
          ? "La fecha límite pasó, así que ya no se puede editar. Esto es lo que quedó presentado."
          : "El comité aprobó tu proyecto. Queda acá para consulta."}
      </p>

      <dl className="mt-6 flex flex-col gap-5">
        <div>
          <dt className="micro-label">Título</dt>
          <dd className="mt-1 font-display text-lg font-bold leading-snug text-ink">
            {datos.titulo || "—"}
          </dd>
        </div>
        <div>
          <dt className="micro-label">Resumen</dt>
          <dd className="mt-1 whitespace-pre-line text-sm leading-relaxed text-slate-600">
            {datos.resumen || "—"}
          </dd>
        </div>
        {SECCIONES_PROYECTO.map((seccion) => (
          <div key={seccion}>
            <dt className="micro-label">{SECCIONES[seccion].titulo}</dt>
            <dd className="mt-1 whitespace-pre-line text-sm leading-relaxed text-slate-600">
              {datos.secciones[seccion] || "—"}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
