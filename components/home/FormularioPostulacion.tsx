"use client";

import { useId, useRef, useState } from "react";

import { CONVOCATORIA_CERRADA, FORMULARIO, type CampoFormulario } from "@/content/elcop";
import {
  MINIMO_MOTIVACION,
  validarCampo,
  type ErroresPostulacion as Errores,
  type ValoresPostulacion as Valores
} from "@/lib/postulacion-validacion";
import { FormularioNovedades } from "@/components/home/FormularioNovedades";

type Estado = "editando" | "enviando" | "enviado" | "error" | "duplicada";

const VALORES_INICIALES: Valores = Object.fromEntries(
  FORMULARIO.campos.map((campo) => [campo.id, ""])
);

/**
 * La sección de postulación, en sus dos estados.
 *
 * Entre convocatorias no se muestra el formulario de admisión: se muestra el
 * aviso y se pide un contacto para avisar cuando abra (pedido de ELCOP,
 * 28/9/2026). Quién decide el estado es el servidor —`convocatoriaAbierta()`
 * en `app/page.tsx`—, así que el interruptor es una variable de entorno y no
 * algo que se pueda tocar desde el navegador.
 */
export function FormularioPostulacion({ abierta }: { abierta: boolean }) {
  const idBase = useId();
  const formRef = useRef<HTMLFormElement>(null);

  const [valores, setValores] = useState<Valores>(VALORES_INICIALES);
  const [errores, setErrores] = useState<Errores>({});
  const [intentado, setIntentado] = useState(false);
  const [estado, setEstado] = useState<Estado>("editando");
  // El endpoint avisa si el envío se guardó de verdad: en un entorno sin base
  // configurada no se puede decir "recibimos tu postulación" y quedarse ahí.
  const [persistida, setPersistida] = useState(true);

  const idCampo = (id: string) => `${idBase}-${id}`;
  const idError = (id: string) => `${idBase}-${id}-error`;
  const idAyuda = (id: string) => `${idBase}-${id}-ayuda`;

  const actualizar = (campo: CampoFormulario, valor: string) => {
    setValores((previos) => ({ ...previos, [campo.id]: valor }));
    // Una vez que se intentó enviar, el error se limpia en cuanto se corrige:
    // esperar al blur para avisar que ya está bien se siente lento.
    if (intentado) {
      setErrores((previos) => ({ ...previos, [campo.id]: validarCampo(campo, valor) ?? "" }));
    }
  };

  const alSalirDelCampo = (campo: CampoFormulario) => {
    if (!intentado) return;
    setErrores((previos) => ({
      ...previos,
      [campo.id]: validarCampo(campo, valores[campo.id] ?? "") ?? ""
    }));
  };

  const enviar = async (evento: React.FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    setIntentado(true);

    const nuevos: Errores = {};
    for (const campo of FORMULARIO.campos) {
      const error = validarCampo(campo, valores[campo.id] ?? "");
      if (error) nuevos[campo.id] = error;
    }
    setErrores(nuevos);

    const primero = FORMULARIO.campos.find((campo) => nuevos[campo.id]);
    if (primero) {
      // El foco va al primer campo con problema: quien navega con teclado o
      // lector de pantalla queda parado justo donde tiene que corregir.
      const nodo = formRef.current?.querySelector<HTMLElement>(`#${CSS.escape(idCampo(primero.id))}`);
      nodo?.focus();
      return;
    }

    setEstado("enviando");
    try {
      const respuesta = await fetch("/api/postulacion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(valores)
      });
      const cuerpo = (await respuesta.json().catch(() => null)) as
        | { persistida?: boolean; duplicada?: boolean }
        | null;

      if (respuesta.ok) {
        setPersistida(cuerpo?.persistida !== false);
        setEstado("enviado");
      } else {
        // "Ya te teníamos" no es un error de la persona ni una falla nuestra.
        setEstado(cuerpo?.duplicada ? "duplicada" : "error");
      }
    } catch {
      setEstado("error");
    }
  };

  const cantidadErrores = Object.values(errores).filter(Boolean).length;

  if (!abierta) {
    return (
      <section id="postulacion" className="section-block">
        <div className="section-heading">
          <div className="max-w-2xl">
            <p className="section-kicker">{CONVOCATORIA_CERRADA.kicker}</p>
            <h2>{CONVOCATORIA_CERRADA.titulo}</h2>
          </div>
        </div>

        <div className="rounded-[28px] border border-black/5 bg-white p-6 shadow-card md:p-10">
          <p className="max-w-2xl text-base leading-relaxed text-slate-600">
            {CONVOCATORIA_CERRADA.aviso}
          </p>
          <FormularioNovedades />
        </div>
      </section>
    );
  }

  if (estado === "duplicada") {
    return (
      <section id="postulacion" className="section-block">
        <div
          role="status"
          className="mx-auto max-w-2xl rounded-[28px] border border-black/5 bg-white p-8 text-center shadow-card md:p-12"
        >
          <span
            aria-hidden="true"
            className="mx-auto grid size-14 place-items-center rounded-2xl bg-sand font-display text-2xl font-extrabold text-municipal-900"
          >
            !
          </span>
          <h2 className="mt-6 font-display text-2xl font-extrabold tracking-tight text-ink md:text-3xl">
            Ya teníamos tu postulación
          </h2>
          <p className="mt-3 text-base leading-relaxed text-slate-600">
            Figura una postulación con ese DNI para esta convocatoria, así que no hace falta que
            la cargues de nuevo. Si necesitás corregir algo, escribinos y lo vemos.
          </p>
        </div>
      </section>
    );
  }

  if (estado === "enviado") {
    return (
      <section id="postulacion" className="section-block">
        <div
          role="status"
          className="mx-auto max-w-2xl rounded-[28px] border border-black/5 bg-white p-8 text-center shadow-card md:p-12"
        >
          <span
            aria-hidden="true"
            className="mx-auto grid size-14 place-items-center rounded-2xl bg-municipal-50 font-display text-2xl font-extrabold text-municipal-700"
          >
            ✓
          </span>
          <h2 className="mt-6 font-display text-2xl font-extrabold tracking-tight text-ink md:text-3xl">
            Recibimos tu postulación
          </h2>
          <p className="mt-3 text-base leading-relaxed text-slate-600">
            Te vamos a escribir por email para coordinar la entrevista de admisión, que es la
            segunda etapa obligatoria del proceso.
          </p>
          {/* Sólo cuando no hay base: una postulación que no se guardó no se
              puede dar por presentada. Con base configurada, el cartel no va. */}
          {!persistida && (
            <p className="mt-6 inline-flex">
              <span className="badge-soft">
                <i className="bg-brandYellow" />
                Formulario en pruebas: el envío todavía no queda registrado
              </span>
            </p>
          )}
        </div>
      </section>
    );
  }

  return (
    <section id="postulacion" className="section-block">
      <div className="section-heading">
        <div className="max-w-2xl">
          <p className="section-kicker">Postulación</p>
          <h2>Postulate a la diplomatura</h2>
          <p className="text-base">
            Completá tus datos y contanos tu motivación. Es la primera de las dos etapas del
            proceso de admisión.
          </p>
        </div>
      </div>

      <form
        ref={formRef}
        noValidate
        onSubmit={enviar}
        aria-describedby={`${idBase}-resumen`}
        className="rounded-[28px] border border-black/5 bg-white p-6 shadow-card md:p-10"
      >
        {/* Resumen de errores: se anuncia una sola vez, con el total, en lugar
            de que el lector de pantalla recite campo por campo. */}
        <div id={`${idBase}-resumen`} role="alert" className="empty:hidden">
          {intentado && cantidadErrores > 0 && (
            <p className="mb-6 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
              <span aria-hidden="true">⚠</span>
              {cantidadErrores === 1
                ? "Hay 1 campo con un dato pendiente de corregir."
                : `Hay ${cantidadErrores} campos con datos pendientes de corregir.`}
            </p>
          )}
          {estado === "error" && (
            <p className="mb-6 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
              <span aria-hidden="true">⚠</span>
              No pudimos enviar la postulación. Probá de nuevo en unos minutos.
            </p>
          )}
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {FORMULARIO.campos.map((campo) => {
            const error = intentado ? errores[campo.id] : "";
            const descritoPor = [campo.ayuda ? idAyuda(campo.id) : null, error ? idError(campo.id) : null]
              .filter(Boolean)
              .join(" ");

            return (
              <div
                key={campo.id}
                className={`form-field ${campo.tipo === "textarea" ? "md:col-span-2" : ""}`}
              >
                <label htmlFor={idCampo(campo.id)} className="form-label">
                  {campo.etiqueta}
                  {campo.requerido && (
                    <span className="ml-1 text-red-600" aria-hidden="true">
                      *
                    </span>
                  )}
                  {!campo.requerido && <span className="ml-1 text-slate-400">(opcional)</span>}
                </label>

                <Control
                  campo={campo}
                  id={idCampo(campo.id)}
                  valor={valores[campo.id] ?? ""}
                  invalido={Boolean(error)}
                  descritoPor={descritoPor || undefined}
                  onChange={(valor) => actualizar(campo, valor)}
                  onBlur={() => alSalirDelCampo(campo)}
                />

                {campo.tipo === "textarea" && campo.maximoCaracteres && (
                  <ContadorCaracteres
                    actual={(valores[campo.id] ?? "").trim().length}
                    maximo={campo.maximoCaracteres}
                    minimo={MINIMO_MOTIVACION}
                  />
                )}

                {campo.ayuda && (
                  <p id={idAyuda(campo.id)} className="form-hint">
                    {campo.ayuda}
                    {campo.maximoCaracteres
                      ? ` Entre ${MINIMO_MOTIVACION} y ${campo.maximoCaracteres} caracteres.`
                      : ""}
                  </p>
                )}

                {error && (
                  <p id={idError(campo.id)} className="form-error">
                    <span aria-hidden="true">⚠</span>
                    {error}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex flex-col gap-4 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-tiny text-slate-500">
            <span aria-hidden="true" className="text-red-600">
              *
            </span>{" "}
            Los campos marcados son obligatorios.
          </p>
          <button type="submit" className="primary-button justify-center" disabled={estado === "enviando"}>
            {estado === "enviando" ? "Enviando…" : "Enviar postulación"}
            {estado !== "enviando" && <span aria-hidden="true">→</span>}
          </button>
        </div>
      </form>
    </section>
  );
}

type PropsControl = {
  campo: CampoFormulario;
  id: string;
  valor: string;
  invalido: boolean;
  descritoPor?: string;
  onChange: (valor: string) => void;
  onBlur: () => void;
};

function Control({ campo, id, valor, invalido, descritoPor, onChange, onBlur }: PropsControl) {
  const comunes = {
    id,
    name: campo.id,
    value: valor,
    required: campo.requerido,
    "aria-invalid": invalido,
    "aria-describedby": descritoPor,
    onBlur,
    className: "form-control"
  };

  if (campo.tipo === "textarea") {
    return (
      <textarea
        {...comunes}
        rows={6}
        maxLength={campo.maximoCaracteres}
        placeholder={campo.placeholder}
        className="form-control resize-y"
        onChange={(evento) => onChange(evento.target.value)}
      />
    );
  }

  if (campo.tipo === "select") {
    return (
      <select {...comunes} onChange={(evento) => onChange(evento.target.value)}>
        <option value="">Elegí una opción</option>
        {campo.opciones?.map((opcion) => (
          <option key={opcion} value={opcion}>
            {opcion}
          </option>
        ))}
      </select>
    );
  }

  return (
    <input
      {...comunes}
      type={campo.tipo}
      placeholder={campo.placeholder}
      autoComplete={campo.autoComplete}
      inputMode={campo.id === "dni" ? "numeric" : undefined}
      onChange={(evento) => onChange(evento.target.value)}
    />
  );
}

function ContadorCaracteres({
  actual,
  maximo,
  minimo
}: {
  actual: number;
  maximo: number;
  minimo: number;
}) {
  const corto = actual > 0 && actual < minimo;
  return (
    <p className="flex items-center justify-between gap-2 text-tiny">
      <span className={corto ? "font-semibold text-slate-600" : "text-slate-500"}>
        {corto ? `Faltan ${minimo - actual} caracteres para el mínimo` : " "}
      </span>
      {/* El conteo es apoyo visual: el mínimo y el máximo ya están en la ayuda
          del campo, que sí lee el lector de pantalla. */}
      <span aria-hidden="true" className="tabular-nums text-slate-500">
        {actual}/{maximo}
      </span>
    </p>
  );
}
