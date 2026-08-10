"use client";

import { useEffect, useRef, useState } from "react";

/**
 * La burbuja del asistente.
 *
 * ## Accesibilidad, que es lo que un panel flotante rompe primero
 *
 * - El panel es un `dialog` modal con nombre accesible, y el foco entra al
 *   abrirlo y **vuelve al botón** al cerrarlo. Sin eso, quien navega con teclado
 *   queda tabulando por detrás de un panel abierto.
 * - `Escape` cierra, porque es lo que espera cualquiera.
 * - Las respuestas se anuncian por `aria-live`: si no, un lector de pantalla no
 *   se enteraría de que llegó la contestación.
 * - El foco queda atrapado dentro del panel mientras está abierto.
 *
 * ## Peso
 *
 * El avatar de la burbuja cerrada es un fotograma estático de 1,5 KB. El sticker
 * animado pesa 118 KB y **sólo se carga cuando el panel se abre**: el sitio
 * sostiene 99 en Lighthouse y 118 KB en todas las páginas se notan.
 */

type Mensaje = { rol: "usuario" | "asistente"; texto: string };

const SALUDO =
  "¡Hola! Soy Migue. Acá te ayudo con la Escuela: la diplomatura, la beca y cómo se ingresa. ¿Qué querés saber?";

const SUGERENCIAS = [
  "¿Qué incluye la beca?",
  "¿Cómo es el proceso de selección?",
  "¿Cuánto dura la cursada?"
];

export function BurbujaChat() {
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [borrador, setBorrador] = useState("");
  const [esperando, setEsperando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const panelRef = useRef<HTMLDivElement>(null);
  const botonRef = useRef<HTMLButtonElement>(null);
  const campoRef = useRef<HTMLInputElement>(null);
  const listaRef = useRef<HTMLDivElement>(null);
  const cancelarRef = useRef<AbortController | null>(null);

  // Al abrir, el foco entra al campo. Al cerrar, vuelve al botón que lo abrió.
  useEffect(() => {
    if (abierto) campoRef.current?.focus();
    else botonRef.current?.focus();
  }, [abierto]);

  // Escape cierra, y el Tab no se escapa del panel mientras está abierto.
  useEffect(() => {
    if (!abierto) return;

    const alPresionar = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") {
        setAbierto(false);
        return;
      }
      if (evento.key !== "Tab" || !panelRef.current) return;

      const enfocables = panelRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
      );
      if (enfocables.length === 0) return;
      const primero = enfocables[0]!;
      const ultimo = enfocables[enfocables.length - 1]!;

      if (evento.shiftKey && document.activeElement === primero) {
        evento.preventDefault();
        ultimo.focus();
      } else if (!evento.shiftKey && document.activeElement === ultimo) {
        evento.preventDefault();
        primero.focus();
      }
    };

    document.addEventListener("keydown", alPresionar);
    return () => document.removeEventListener("keydown", alPresionar);
  }, [abierto]);

  // La conversación se sigue sola hacia abajo mientras la respuesta llega.
  useEffect(() => {
    listaRef.current?.scrollTo({ top: listaRef.current.scrollHeight });
  }, [mensajes, esperando]);

  // Si se cierra el panel con una respuesta en curso, se corta el pedido: del
  // otro lado hay tokens que se siguen pagando.
  useEffect(() => {
    if (!abierto) cancelarRef.current?.abort();
  }, [abierto]);

  const enviar = async (texto: string) => {
    const pregunta = texto.trim();
    if (pregunta === "" || esperando) return;

    setError(null);
    setBorrador("");
    const historial = mensajes;
    setMensajes([...historial, { rol: "usuario", texto: pregunta }]);
    setEsperando(true);

    const controlador = new AbortController();
    cancelarRef.current = controlador;

    try {
      const respuesta = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mensaje: pregunta, historial }),
        signal: controlador.signal
      });

      if (!respuesta.ok || !respuesta.body) {
        const cuerpo = (await respuesta.json().catch(() => null)) as { mensaje?: string } | null;
        setError(cuerpo?.mensaje ?? "No pude responder. Probá de nuevo en un rato.");
        setEsperando(false);
        return;
      }

      // La respuesta llega de a pedazos: se agrega un mensaje vacío y se le va
      // sumando texto, así se lee mientras se escribe.
      setMensajes((previos) => [...previos, { rol: "asistente", texto: "" }]);
      setEsperando(false);

      const lector = respuesta.body.getReader();
      const decodificar = new TextDecoder();

      for (;;) {
        const { done, value } = await lector.read();
        if (done) break;
        const trozo = decodificar.decode(value, { stream: true });
        setMensajes((previos) => {
          const copia = [...previos];
          const ultimo = copia[copia.length - 1]!;
          copia[copia.length - 1] = { ...ultimo, texto: ultimo.texto + trozo };
          return copia;
        });
      }
    } catch (fallo) {
      // Abortar al cerrar el panel no es un error que haya que mostrar.
      if ((fallo as Error)?.name !== "AbortError") {
        setError("Se cortó la conexión. Probá de nuevo.");
      }
      setEsperando(false);
    } finally {
      cancelarRef.current = null;
    }
  };

  return (
    <>
      {abierto && (
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="chat-titulo"
          className="fixed bottom-4 right-4 z-50 flex max-h-[min(32rem,calc(100vh-2rem))] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-[24px] border border-black/5 bg-white shadow-card"
        >
          <div className="flex items-center gap-3 border-b border-slate-100 bg-municipal-50 p-4">
            {/* El animado entra sólo acá, cuando el panel ya está abierto.
                `img` y no `next/image`: los dos archivos ya son WebP del tamaño
                exacto en que se muestran, así que el optimizador no tiene nada
                que optimizar y sólo agrega un pedido y trabajo de hidratación
                —medido: costaba 8 puntos de Performance—. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/migue-saludo.webp"
              alt=""
              width={40}
              height={40}
              className="size-10 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p id="chat-titulo" className="font-display text-base font-bold leading-tight text-ink">
                Migue
              </p>
              <p className="text-tiny text-slate-600">Te ayudo con la Escuela</p>
            </div>
            <button
              type="button"
              onClick={() => setAbierto(false)}
              className="flex size-11 items-center justify-center rounded-xl text-slate-600 transition ease-out hover:bg-white hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-municipal-500"
            >
              <span aria-hidden="true" className="text-xl leading-none">
                ×
              </span>
              <span className="sr-only">Cerrar el chat</span>
            </button>
          </div>

          <div ref={listaRef} className="flex-1 overflow-y-auto p-4">
            <p className="rounded-2xl bg-slate-50 p-3 text-sm leading-relaxed text-slate-600">
              {SALUDO}
            </p>

            <div aria-live="polite" className="mt-3 flex flex-col gap-3">
              {mensajes.map((mensaje, indice) => (
                <p
                  key={indice}
                  className={
                    mensaje.rol === "usuario"
                      ? "ml-auto max-w-[85%] rounded-2xl bg-municipal-700 p-3 text-sm leading-relaxed text-white"
                      : "max-w-[85%] whitespace-pre-line rounded-2xl bg-slate-50 p-3 text-sm leading-relaxed text-slate-600"
                  }
                >
                  {mensaje.texto}
                  {/* Mientras el texto llega, el último mensaje queda vacío por
                      un instante: sin esto se vería un globo en blanco. */}
                  {mensaje.rol === "asistente" && mensaje.texto === "" && (
                    <span className="text-slate-500">Escribiendo…</span>
                  )}
                </p>
              ))}

              {esperando && (
                <p className="max-w-[85%] rounded-2xl bg-slate-50 p-3 text-sm text-slate-500">
                  Pensando…
                </p>
              )}

              {error && (
                <p className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
                  {error}
                </p>
              )}
            </div>

            {mensajes.length === 0 && (
              <div className="mt-4 flex flex-col items-start gap-2">
                {SUGERENCIAS.map((sugerencia) => (
                  <button
                    key={sugerencia}
                    type="button"
                    onClick={() => void enviar(sugerencia)}
                    className="min-h-11 rounded-xl border border-municipal-500/25 px-3 text-left text-sm font-semibold text-municipal-900 transition ease-out hover:bg-municipal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-municipal-500"
                  >
                    {sugerencia}
                  </button>
                ))}
              </div>
            )}
          </div>

          <form
            onSubmit={(evento) => {
              evento.preventDefault();
              void enviar(borrador);
            }}
            className="flex items-end gap-2 border-t border-slate-100 p-3"
          >
            <label htmlFor="chat-campo" className="sr-only">
              Escribí tu pregunta
            </label>
            <input
              ref={campoRef}
              id="chat-campo"
              type="text"
              value={borrador}
              maxLength={600}
              autoComplete="off"
              placeholder="Escribí tu pregunta"
              onChange={(evento) => setBorrador(evento.target.value)}
              className="form-control min-h-11 flex-1"
            />
            <button
              type="submit"
              disabled={esperando || borrador.trim() === ""}
              className="primary-button min-h-11 shrink-0 px-4"
            >
              <span aria-hidden="true">→</span>
              <span className="sr-only">Enviar la pregunta</span>
            </button>
          </form>

          <p className="border-t border-slate-100 px-4 py-2 text-micro leading-relaxed text-slate-600">
            Respuestas generadas automáticamente sobre el contenido de este sitio. Pueden tener
            errores: lo que decide es la información oficial de ELCOP.
          </p>
        </div>
      )}

      <button
        ref={botonRef}
        type="button"
        onClick={() => setAbierto((previo) => !previo)}
        aria-expanded={abierto}
        className="fixed bottom-4 right-4 z-40 flex size-14 items-center justify-center rounded-full bg-white shadow-card ring-1 ring-black/5 transition ease-out hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-municipal-500 focus-visible:ring-offset-2 motion-reduce:transition-none motion-reduce:hover:scale-100"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/migue-avatar.webp"
          alt=""
          width={48}
          height={48}
          className="size-12 rounded-full"
        />
        <span className="sr-only">{abierto ? "Cerrar el chat" : "Abrir el chat con Migue"}</span>
      </button>
    </>
  );
}
