"use client";

import { useId, useRef, useState } from "react";

import { FORMULARIO, type CampoFormulario } from "@/content/elcop";

type Valores = Record<string, string>;
type Errores = Record<string, string>;
type Estado = "editando" | "enviando" | "enviado" | "error";

const VALORES_INICIALES: Valores = Object.fromEntries(
  FORMULARIO.campos.map((campo) => [campo.id, ""])
);

const MINIMO_MOTIVACION = 100;

/** Reglas de validación por campo. Devuelve el mensaje de error o `null`. */
function validarCampo(campo: CampoFormulario, valor: string): string | null {
  const limpio = valor.trim();

  if (campo.requerido && limpio === "") {
    return campo.tipo === "select"
      ? `Elegí una opción en «${campo.etiqueta}».`
      : `Completá el campo «${campo.etiqueta}».`;
  }
  if (limpio === "") return null;

  switch (campo.id) {
    case "nombre":
      if (limpio.length < 3) return "Escribí tu nombre y apellido completos.";
      return null;

    case "dni":
      if (!/^\d{7,8}$/.test(limpio.replace(/\./g, ""))) {
        return "El DNI se escribe sin puntos, con 7 u 8 dígitos.";
      }
      return null;

    case "nacimiento": {
      const fecha = new Date(`${limpio}T00:00:00`);
      if (Number.isNaN(fecha.getTime())) return "Ingresá una fecha válida.";
      const hoy = new Date();
      if (fecha > hoy) return "La fecha de nacimiento no puede ser futura.";
      // Edad cumplida a la fecha de hoy.
      let edad = hoy.getFullYear() - fecha.getFullYear();
      const mes = hoy.getMonth() - fecha.getMonth();
      if (mes < 0 || (mes === 0 && hoy.getDate() < fecha.getDate())) edad -= 1;
      if (edad < 16) return "Tenés que tener al menos 16 años para postularte.";
      if (edad > 110) return "Revisá el año: la fecha parece incorrecta.";
      return null;
    }

    case "email":
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(limpio)) {
        return "Revisá el email: falta el @ o el dominio.";
      }
      return null;

    case "telefono": {
      const digitos = limpio.replace(/\D/g, "");
      if (digitos.length < 8) return "Ingresá el teléfono con característica, sin el 0 ni el 15.";
      return null;
    }

    case "localidad":
    case "ocupacion":
      if (limpio.length < 2) return "Este dato es muy corto, escribilo completo.";
      return null;

    case "motivacion": {
      if (limpio.length < MINIMO_MOTIVACION) {
        return `Contanos un poco más: faltan ${MINIMO_MOTIVACION - limpio.length} caracteres.`;
      }
      if (campo.maximoCaracteres && limpio.length > campo.maximoCaracteres) {
        return `Te pasaste del máximo de ${campo.maximoCaracteres} caracteres.`;
      }
      return null;
    }

    default:
      return null;
  }
}

export function FormularioPostulacion() {
  const idBase = useId();
  const formRef = useRef<HTMLFormElement>(null);

  const [valores, setValores] = useState<Valores>(VALORES_INICIALES);
  const [errores, setErrores] = useState<Errores>({});
  const [intentado, setIntentado] = useState(false);
  const [estado, setEstado] = useState<Estado>("editando");

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
      setEstado(respuesta.ok ? "enviado" : "error");
    } catch {
      setEstado("error");
    }
  };

  const cantidadErrores = Object.values(errores).filter(Boolean).length;

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
          {/* Mientras el formulario no tenga destino real, se dice: no podemos
              dar por presentada una postulación que todavía no se guarda. */}
          <p className="mt-6 inline-flex">
            <span className="badge-soft">
              <i className="bg-brandYellow" />
              Formulario en pruebas: el envío todavía no queda registrado
            </span>
          </p>
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
