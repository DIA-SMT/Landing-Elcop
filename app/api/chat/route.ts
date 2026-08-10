import { instruccionesDelAsistente } from "@/lib/chat/contexto";
import { identificar, permitirLlamada } from "@/lib/chat/limite";

/**
 * El chat del asistente, contra OpenRouter.
 *
 * ## Por qué el navegador no habla con OpenRouter
 *
 * La clave de OpenRouter paga por token. Una clave en el cliente es una clave
 * pública, y una clave pública que gasta dinero se agota el día que alguien mira
 * la pestaña de red. Así que el navegador habla con esta ruta y esta ruta habla
 * con OpenRouter: la clave vive sólo en el servidor.
 *
 * ## Lo que esta ruta controla, y el cliente no puede
 *
 * - **El límite de frecuencia.** Un contador en el navegador se saltea con F5.
 * - **Las instrucciones del asistente.** Si vinieran en el cuerpo, cualquiera
 *   podría reemplazarlas y usar la cuenta de ELCOP como un chat de propósito
 *   general. Se arman acá, del contenido del sitio.
 * - **El historial.** Se acepta del cliente porque el chat no tiene sesión, pero
 *   se recorta y se limpia: sólo los últimos turnos, sólo roles conocidos, y
 *   nada que se haga pasar por instrucción del sistema.
 *
 * ## Qué devuelve
 *
 * Texto plano en streaming, no JSON. El cliente lo va mostrando a medida que
 * llega: con una respuesta completa habría cinco segundos de pausa muerta, y en
 * un chat eso se lee como que se colgó.
 */

/**
 * Cuenta por qué falló la llamada, en dos niveles.
 *
 * - `resumen` sale **siempre**, también en producción. Sin una línea en los
 *   registros, una clave sin saldo se ve igual que todo funcionando: el
 *   visitante ve "no está disponible" y nadie se entera nunca.
 * - `detalle` sale **sólo en desarrollo**. Es el cuerpo que manda el proveedor,
 *   y puede traer datos de la cuenta. Mismo criterio que `lib/cidituc-perfil.ts`.
 *
 * Ninguno de los dos imprime la clave.
 */
function diagnosticar(resumen: string, detalle?: string): void {
  const enDesarrollo = process.env.NODE_ENV !== "production";
  console.warn(`[chat] ${resumen}${enDesarrollo && detalle ? ` — ${detalle}` : ""}`);
}

const MODELO_POR_OMISION = "anthropic/claude-haiku-4.5";
const LIMITES = { mensaje: 600, turnos: 8 } as const;
const TIEMPO_LIMITE_MS = 30_000;

type Turno = { rol: "usuario" | "asistente"; texto: string };

/** Se queda con los últimos turnos válidos y descarta cualquier otra cosa. */
function leerHistorial(valor: unknown): Turno[] {
  if (!Array.isArray(valor)) return [];
  return valor
    .filter(
      (t): t is Turno =>
        typeof t === "object" &&
        t !== null &&
        ((t as Turno).rol === "usuario" || (t as Turno).rol === "asistente") &&
        typeof (t as Turno).texto === "string" &&
        (t as Turno).texto.trim() !== ""
    )
    .slice(-LIMITES.turnos)
    .map((t) => ({ rol: t.rol, texto: t.texto.slice(0, LIMITES.mensaje) }));
}

function error(mensaje: string, estado: number, extra?: Record<string, unknown>) {
  return Response.json({ ok: false, mensaje, ...extra }, { status: estado });
}

export async function POST(request: Request) {
  const clave = process.env.OPENROUTER_API_KEY;
  if (!clave) {
    // Sin clave no se finge una respuesta: el chat avisa que no está disponible.
    return error("El asistente no está configurado todavía.", 503);
  }

  const veredicto = permitirLlamada(identificar(request));
  if (!veredicto.permitido) {
    return error(veredicto.motivo, 429, { esperarSeg: veredicto.esperarSeg });
  }

  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
  } catch {
    return error("El cuerpo no es JSON válido.", 400);
  }

  if (typeof cuerpo !== "object" || cuerpo === null) {
    return error("Se esperaba un objeto.", 400);
  }

  const { mensaje, historial } = cuerpo as { mensaje?: unknown; historial?: unknown };

  if (typeof mensaje !== "string" || mensaje.trim() === "") {
    return error("Escribí una pregunta.", 400);
  }
  if (mensaje.length > LIMITES.mensaje * 2) {
    return error("La pregunta es demasiado larga.", 400);
  }

  const mensajes = [
    { role: "system", content: instruccionesDelAsistente() },
    ...leerHistorial(historial).map((t) => ({
      role: t.rol === "usuario" ? "user" : "assistant",
      content: t.texto
    })),
    { role: "user", content: mensaje.trim().slice(0, LIMITES.mensaje) }
  ];

  const cancelar = AbortSignal.timeout(TIEMPO_LIMITE_MS);

  let respuesta: Response;
  try {
    respuesta = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      signal: cancelar,
      headers: {
        Authorization: `Bearer ${clave}`,
        "Content-Type": "application/json",
        // OpenRouter los usa para atribuir el tráfico en su panel.
        //
        // Sólo ASCII: un valor de cabecera es una ByteString, así que cualquier
        // carácter por encima de 255 —una raya larga, una tilde— hace fallar el
        // `fetch` entero antes de salir a la red. Acá había un "ELCOP — Escuela"
        // y rompía todas las llamadas.
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITIO_URL ?? "https://landing-elcop.vercel.app",
        "X-Title": "ELCOP"
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODELO ?? MODELO_POR_OMISION,
        // Si el modelo elegido está caído, OpenRouter prueba el siguiente en vez
        // de devolver un error al visitante.
        models: [process.env.OPENROUTER_MODELO ?? MODELO_POR_OMISION, "google/gemini-2.5-flash-lite"],
        messages: mensajes,
        stream: true,
        max_tokens: 500,
        temperature: 0.2
      })
    });
  } catch (fallo) {
    // El nombre del error alcanza para saber qué clase de falla es: TimeoutError
    // es el proveedor, cualquier otra cosa somos nosotros. El mensaje va aparte
    // porque es texto libre de una librería y no se controla qué trae.
    const nombre = (fallo as Error)?.name ?? "Error";
    diagnosticar(`la llamada falló con ${nombre}`, (fallo as Error)?.message);

    // Decir "tardó demasiado" ante un error de programación manda a esperar por
    // algo que solo nunca va a mejorar.
    return nombre === "TimeoutError"
      ? error("El asistente tardó demasiado. Probá de nuevo.", 504)
      : error("El asistente no está disponible en este momento.", 502);
  }

  if (!respuesta.ok || !respuesta.body) {
    // El cuerpo del error del proveedor no se reenvía al visitante ni se
    // registra en producción: puede traer datos de la cuenta. En desarrollo sí,
    // que es lo que permite distinguir una clave sin saldo de un modelo mal
    // escrito. El código de estado, en cambio, se registra siempre.
    const cuerpo =
      process.env.NODE_ENV === "production"
        ? undefined
        : (await respuesta.text().catch(() => "")).slice(0, 300);
    diagnosticar(`OpenRouter respondió ${respuesta.status}`, cuerpo);
    return error("El asistente no está disponible en este momento.", 502);
  }

  // Se traduce el SSE de OpenRouter a texto plano. El cliente sólo tiene que
  // concatenar lo que llega, sin parsear eventos.
  const lector = respuesta.body.getReader();
  const decodificar = new TextDecoder();
  const codificar = new TextEncoder();

  const flujo = new ReadableStream<Uint8Array>({
    // `start` y no `pull`: se drena el flujo del proveedor de una vez. `pull` se
    // llama cuando el consumidor pide más, y acá no hay nada que pedir de a
    // pedazos: lo que llega se reenvía.
    async start(controlador) {
      let pendiente = "";
      try {
        for (;;) {
          const { done, value } = await lector.read();
          if (done) break;

          pendiente += decodificar.decode(value, { stream: true });
          const lineas = pendiente.split("\n");
          // La última puede estar cortada al medio: queda para la próxima vuelta.
          pendiente = lineas.pop() ?? "";

          for (const linea of lineas) {
            if (!linea.startsWith("data:")) continue;
            const dato = linea.slice(5).trim();
            if (dato === "" || dato === "[DONE]") continue;
            try {
              const trozo = JSON.parse(dato) as {
                choices?: { delta?: { content?: string } }[];
              };
              const texto = trozo.choices?.[0]?.delta?.content;
              if (texto) controlador.enqueue(codificar.encode(texto));
            } catch {
              // Comentarios de keep-alive y basura parcial: se ignoran.
            }
          }
        }
      } finally {
        controlador.close();
        lector.releaseLock();
      }
    },
    cancel() {
      // El visitante cerró el panel: se corta con el proveedor y se deja de pagar.
      void lector.cancel();
    }
  });

  return new Response(flujo, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no"
    }
  });
}
