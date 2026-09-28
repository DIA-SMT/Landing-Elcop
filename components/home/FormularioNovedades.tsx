"use client";

import { useId, useRef, useState } from "react";

import { CONVOCATORIA_CERRADA, NOVEDADES, type CampoFormulario } from "@/content/elcop";

type Valores = Record<string, string>;
type Errores = Record<string, string>;
type Estado = "editando" | "enviando" | "enviado" | "error";

const VALORES_INICIALES: Valores = Object.fromEntries(NOVEDADES.campos.map((c) => [c.id, ""]));

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Las mismas reglas que valida el endpoint. Son pocas y no se comparten con la
 * postulación a propósito: acá se pide un contacto, no una declaración.
 */
function validarCampo(campo: CampoFormulario, valor: string): string | null {
  const limpio = valor.trim();

  if (campo.requerido && limpio === "") return `Completá el campo «${campo.etiqueta}».`;
  if (limpio === "") return null;

  if (campo.id === "nombre" && limpio.length < 3) return "Escribí tu nombre y apellido.";
  if (campo.id === "email" && !EMAIL.test(limpio)) {
    return "Revisá el email: falta el @ o el dominio.";
  }
  if (campo.id === "telefono" && limpio.replace(/\D/g, "").length < 8) {
    return "Ingresá el teléfono con característica, sin el 0 ni el 15.";
  }
  return null;
}

/**
 * El formulario que reemplaza a la postulación entre convocatorias.
 *
 * No reutiliza `FormularioPostulacion` porque no es el mismo acto: uno declara
 * datos para un proceso de admisión y el otro deja un contacto para un aviso.
 */
export function FormularioNovedades() {
  const idBase = useId();
  const formRef = useRef<HTMLFormElement>(null);

  const [valores, setValores] = useState<Valores>(VALORES_INICIALES);
  const [errores, setErrores] = useState<Errores>({});
  const [intentado, setIntentado] = useState(false);
  const [estado, setEstado] = useState<Estado>("editando");
  const [persistido, setPersistido] = useState(true);

  const idCampo = (id: string) => `${idBase}-${id}`;
  const idError = (id: string) => `${idBase}-${id}-error`;

  const actualizar = (campo: CampoFormulario, valor: string) => {
    setValores((previos) => ({ ...previos, [campo.id]: valor }));
    if (intentado) {
      setErrores((previos) => ({ ...previos, [campo.id]: validarCampo(campo, valor) ?? "" }));
    }
  };

  const enviar = async (evento: React.FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    setIntentado(true);

    const nuevos: Errores = {};
    for (const campo of NOVEDADES.campos) {
      const error = validarCampo(campo, valores[campo.id] ?? "");
      if (error) nuevos[campo.id] = error;
    }
    setErrores(nuevos);

    const primero = NOVEDADES.campos.find((campo) => nuevos[campo.id]);
    if (primero) {
      const nodo = formRef.current?.querySelector<HTMLElement>(
        `#${CSS.escape(idCampo(primero.id))}`
      );
      nodo?.focus();
      return;
    }

    setEstado("enviando");
    try {
      const respuesta = await fetch("/api/interesados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(valores)
      });
      const cuerpo = (await respuesta.json().catch(() => null)) as { persistido?: boolean } | null;
      setPersistido(cuerpo?.persistido !== false);
      setEstado(respuesta.ok ? "enviado" : "error");
    } catch {
      setEstado("error");
    }
  };

  const cantidadErrores = Object.values(errores).filter(Boolean).length;

  if (estado === "enviado") {
    return (
      <div
        role="status"
        className="mt-8 rounded-2xl border border-municipal-100 bg-municipal-50 p-6 text-center"
      >
        <p className="font-display text-lg font-bold text-ink">{CONVOCATORIA_CERRADA.gracias}</p>
        {/* Sin base configurada no se promete un aviso que nadie va a poder mandar. */}
        {!persistido && (
          <p className="mt-4 inline-flex">
            <span className="badge-soft">
              <i className="bg-brandYellow" />
              Formulario en pruebas: el registro todavía no queda guardado
            </span>
          </p>
        )}
      </div>
    );
  }

  return (
    <form ref={formRef} noValidate onSubmit={enviar} className="mt-8">
      <div role="alert" className="empty:hidden">
        {intentado && cantidadErrores > 0 && (
          <p className="mb-5 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            <span aria-hidden="true">⚠</span>
            {cantidadErrores === 1
              ? "Hay 1 campo con un dato pendiente de corregir."
              : `Hay ${cantidadErrores} campos con datos pendientes de corregir.`}
          </p>
        )}
        {estado === "error" && (
          <p className="mb-5 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            <span aria-hidden="true">⚠</span>
            No pudimos guardar tus datos. Probá de nuevo en unos minutos.
          </p>
        )}
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {NOVEDADES.campos.map((campo) => {
          const error = intentado ? errores[campo.id] : "";
          return (
            <div key={campo.id} className="form-field">
              <label htmlFor={idCampo(campo.id)} className="form-label">
                {campo.etiqueta}
                {campo.requerido ? (
                  <span className="ml-1 text-red-600" aria-hidden="true">
                    *
                  </span>
                ) : (
                  <span className="ml-1 text-slate-400">(opcional)</span>
                )}
              </label>
              <input
                id={idCampo(campo.id)}
                name={campo.id}
                type={campo.tipo}
                value={valores[campo.id] ?? ""}
                required={campo.requerido}
                placeholder={campo.placeholder}
                autoComplete={campo.autoComplete}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? idError(campo.id) : undefined}
                className="form-control"
                onChange={(evento) => actualizar(campo, evento.target.value)}
              />
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

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-tiny text-slate-500">
          Usamos tus datos sólo para avisarte cuando abra la convocatoria.
        </p>
        <button
          type="submit"
          className="primary-button justify-center"
          disabled={estado === "enviando"}
        >
          {estado === "enviando" ? "Enviando…" : CONVOCATORIA_CERRADA.boton}
          {estado !== "enviando" && <span aria-hidden="true">→</span>}
        </button>
      </div>
    </form>
  );
}
