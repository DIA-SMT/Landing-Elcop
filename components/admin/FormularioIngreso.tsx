"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";

type Errores = Record<string, string>;

/**
 * El formulario de ingreso al admin.
 *
 * La contraseña se manda a una ruta nuestra, que es la que habla con Supabase.
 * Acá no hay ninguna clave de Supabase ni se guarda nada en el navegador: la
 * sesión son cookies que escribe el servidor.
 */
export function FormularioIngreso() {
  const idBase = useId();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [errores, setErrores] = useState<Errores>({});
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const id = (campo: string) => `${idBase}-${campo}`;

  const enviar = async (evento: React.FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    setErrores({});
    setMensaje(null);
    setEnviando(true);

    try {
      const respuesta = await fetch("/api/admin/ingreso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, contrasena })
      });
      const cuerpo = (await respuesta.json().catch(() => null)) as
        | { errores?: Errores; mensaje?: string }
        | null;

      if (respuesta.ok) {
        // `refresh` antes de navegar: las páginas del admin son dinámicas y leen
        // la cookie en el servidor, así que hay que descartar lo cacheado.
        router.refresh();
        router.replace("/admin");
        return;
      }

      setErrores(cuerpo?.errores ?? {});
      setMensaje(cuerpo?.mensaje ?? "No pudimos ingresarte. Probá de nuevo en unos minutos.");
    } catch {
      setMensaje("No pudimos conectarnos. Revisá tu conexión y probá de nuevo.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form
      noValidate
      onSubmit={enviar}
      className="mx-auto w-full max-w-md rounded-[28px] border border-black/5 bg-white p-6 shadow-card md:p-8"
    >
      <div role="alert" className="empty:hidden">
        {mensaje && (
          <p className="mb-5 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            <span aria-hidden="true">⚠</span>
            {mensaje}
          </p>
        )}
      </div>

      <div className="form-field">
        <label htmlFor={id("email")} className="form-label">
          Email
        </label>
        <input
          id={id("email")}
          name="email"
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={Boolean(errores.email)}
          aria-describedby={errores.email ? id("email-error") : undefined}
          className="form-control"
          placeholder="nombre@smt.gob.ar"
        />
        {errores.email && (
          <p id={id("email-error")} className="form-error">
            <span aria-hidden="true">⚠</span>
            {errores.email}
          </p>
        )}
      </div>

      <div className="form-field mt-5">
        <label htmlFor={id("contrasena")} className="form-label">
          Contraseña
        </label>
        <input
          id={id("contrasena")}
          name="contrasena"
          type="password"
          autoComplete="current-password"
          required
          value={contrasena}
          onChange={(e) => setContrasena(e.target.value)}
          aria-invalid={Boolean(errores.contrasena)}
          aria-describedby={errores.contrasena ? id("contrasena-error") : undefined}
          className="form-control"
        />
        {errores.contrasena && (
          <p id={id("contrasena-error")} className="form-error">
            <span aria-hidden="true">⚠</span>
            {errores.contrasena}
          </p>
        )}
      </div>

      <button type="submit" className="primary-button mt-7 w-full justify-center" disabled={enviando}>
        {enviando ? "Ingresando…" : "Ingresar"}
        {!enviando && <span aria-hidden="true">→</span>}
      </button>

      <p className="mt-5 text-tiny text-slate-500">
        Las cuentas del panel las crea la Dirección de Inteligencia Artificial. Si perdiste el
        acceso, escribinos y te lo reponemos.
      </p>
    </form>
  );
}
