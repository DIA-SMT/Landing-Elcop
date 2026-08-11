/**
 * Consulta del perfil al backend de CIDITUC.
 *
 * ⚠️ **Sólo servidor.** Usa `node:https` y no puede entrar al bundle del
 * navegador ni al runtime Edge del middleware. Por eso vive en un archivo
 * aparte de `lib/cidituc.ts`, que sí corre en los dos.
 *
 * ## Por qué hace falta
 *
 * El token de CIDITUC trae únicamente `id_persona`. Para saber si esa persona
 * es un becario nuestro necesitamos su documento, y eso obliga a preguntarle a
 * su backend. No es opcional: sin esta llamada no hay forma de autorizar.
 *
 * ## El problema del certificado
 *
 * `estadisticas.smt.gob.ar:5000` presenta un certificado válido de Sectigo para
 * `*.smt.gob.ar`, **pero envía sólo el certificado final y no el intermedio de
 * la autoridad**. Los navegadores lo disimulan porque suelen tener el
 * intermedio cacheado; Node no, y falla con `UNABLE_TO_VERIFY_LEAF_SIGNATURE`.
 *
 * Hay tres caminos, en orden de preferencia:
 *
 * 1. **Que infraestructura instale la cadena completa.** Es un cambio de
 *    configuración del servidor y arregla el problema para todos los que
 *    consuman ese backend, no sólo para nosotros.
 * 2. **Aportar el intermedio nosotros** con `CIDITUC_CA_PEM`. Se sigue
 *    verificando firma, dominio y vencimiento: sólo suplimos lo que el servidor
 *    no manda.
 * 3. **Desactivar la verificación**, que es lo que hace hoy educacivil.
 *
 * El tercero está disponible sólo fuera de producción, y a propósito: un parche
 * temporal que se puede dejar prendido en producción no es temporal. Acá, si
 * `NODE_ENV` es `production`, la bandera se ignora.
 */
import { request as pedidoHttp } from "node:http";
import { Agent, request as pedidoHttps } from "node:https";

export type PerfilCidituc = {
  idPersona: number;
  documento: string;
  nombre: string;
  apellido: string;
  email: string | null;
  telefono: string | null;
};

const TIEMPO_LIMITE_MS = 10_000;

function agente(): Agent {
  const ca = process.env.CIDITUC_CA_PEM;
  if (ca) {
    // El intermedio que el servidor no envía. La verificación sigue completa.
    return new Agent({ ca, keepAlive: false });
  }

  const permitirInseguro = process.env.CIDITUC_TLS_INSEGURO === "true";
  const enProduccion = process.env.NODE_ENV === "production";

  if (permitirInseguro && enProduccion) {
    throw new Error(
      "CIDITUC_TLS_INSEGURO no puede usarse en producción. Instalá la cadena completa en el servidor o cargá el intermedio en CIDITUC_CA_PEM."
    );
  }

  return new Agent({ rejectUnauthorized: !permitirInseguro, keepAlive: false });
}

/**
 * Trae el perfil de la persona usando su token. `null` si no se pudo.
 *
 * **Además de traer el documento, esta llamada es lo que valida el token.** El
 * backend de CIDITUC verifica la firma antes de responder, así que uno falso o
 * vencido no devuelve una persona. Por eso no guardamos su clave de firma: no
 * agregaría ninguna comprobación que esta consulta no haga ya.
 */
export async function obtenerPerfil(token: string): Promise<PerfilCidituc | null> {
  const base = process.env.CIDITUC_BACKEND_URL;
  if (!base) throw new Error("Falta CIDITUC_BACKEND_URL.");

  const url = new URL(`${base.replace(/\/$/, "")}/usuarios/authStatus`);
  const enClaro = url.protocol === "http:";

  // Sin cifrar se permite sólo fuera de producción, para poder apuntar a un
  // CIDITUC local. En producción, mandar el token en claro por la red sería
  // regalarlo a cualquiera que mire el tráfico.
  if (enClaro && process.env.NODE_ENV === "production") {
    throw new Error(
      "CIDITUC_BACKEND_URL no puede ser http:// en producción: el token viajaría sin cifrar."
    );
  }

  const cuerpo = await new Promise<string | null>((resolver) => {
    const hacerPeticion = enClaro ? pedidoHttp : pedidoHttps;
    const peticion = hacerPeticion(
      {
        hostname: url.hostname,
        port: url.port || (enClaro ? 80 : 443),
        path: url.pathname,
        method: "GET",
        // Ojo: el backend de CIDITUC espera el token pelado, sin "Bearer".
        headers: { Authorization: token },
        ...(enClaro ? {} : { agent: agente() }),
        timeout: TIEMPO_LIMITE_MS
      },
      (respuesta) => {
        let datos = "";
        respuesta.setEncoding("utf8");
        respuesta.on("data", (parte) => (datos += parte));
        respuesta.on("end", () => {
          if (respuesta.statusCode !== 200) {
            // El estado alcanza para orientarse —401 es el token, 5xx son ellos—
            // y no dice nada de la persona. El cuerpo sí puede.
            diagnosticar(`CIDITUC respondió ${respuesta.statusCode}`, datos.slice(0, 200));
            resolver(null);
            return;
          }
          resolver(datos);
        });
      }
    );

    peticion.on("timeout", () => {
      diagnosticar(`sin respuesta en ${TIEMPO_LIMITE_MS} ms`);
      peticion.destroy();
      resolver(null);
    });
    peticion.on("error", (fallo) => {
      // El más importante de los cinco: acá aparece UNABLE_TO_VERIFY_LEAF_SIGNATURE
      // si el servidor sigue mandando el certificado sin la cadena. Es un código
      // de error de Node, no lleva datos de nadie, y va entero a producción.
      const codigo = (fallo as NodeJS.ErrnoException).code;
      diagnosticar(`fallo de red o TLS: ${codigo ?? "sin código"}`, codigo ? undefined : fallo.message);
      resolver(null);
    });
    peticion.end();
  });

  if (!cuerpo) return null;

  let crudo: unknown;
  try {
    crudo = JSON.parse(cuerpo);
  } catch {
    // Casi siempre es una pantalla de error de un proxy delante de CIDITUC. Que
    // pasó eso se dice siempre; qué decía la pantalla, sólo en desarrollo.
    diagnosticar("la respuesta no es JSON", cuerpo.slice(0, 120));
    return null;
  }

  const perfil = normalizar(crudo);
  if (!perfil) {
    // El caso más difícil de adivinar: 200 con una forma distinta a la esperada.
    //
    // Desenvuelve igual que `normalizar` —la primera versión de esto miraba sólo
    // `user` y terminó reportando las claves de afuera, que no servían de nada— y
    // dice el **tipo** de los dos campos que deciden, porque el problema puede ser
    // que falten o que lleguen como número.
    //
    // Se listan claves y tipos, nunca valores: ahí viven los datos de la persona.
    const envoltorio = crudo as Record<string, unknown>;
    const persona = (envoltorio?.usuarioSinContraseña ?? envoltorio?.user ?? envoltorio) as
      | Record<string, unknown>
      | undefined;
    const claves = persona && typeof persona === "object" ? Object.keys(persona) : [];
    diagnosticar(
      `200 pero no se pudo armar el perfil. documento_persona: ${typeof persona?.documento_persona}, ` +
        `id_persona: ${typeof persona?.id_persona}`,
      `claves recibidas: ${claves.join(", ") || "(ninguna)"}`
    );
  }
  return perfil;
}

/**
 * Cuenta por qué falló la consulta, en dos niveles.
 *
 * - `resumen` sale **siempre**, también en producción. Nombra el problema y nada
 *   más: un código de estado, un código de error de red, un tipo. Sin esto, el
 *   día que el ingreso falle en producción los registros no van a tener ni una
 *   línea y no se va a poder distinguir el certificado del padrón vacío.
 * - `detalle` sale **sólo en desarrollo**. Es lo que manda el otro lado, y ahí
 *   pueden venir datos de la persona.
 *
 * La partición importa por un caso puntual: el fallo de TLS sólo existe en
 * producción. En local hay que apuntar con `CIDITUC_TLS_INSEGURO=true`, que es
 * justamente lo que lo hace desaparecer, así que desarrollo nunca lo muestra.
 *
 * Nunca imprime el token ni valores del perfil, en ningún nivel.
 */
function diagnosticar(resumen: string, detalle?: string): void {
  const enDesarrollo = process.env.NODE_ENV !== "production";
  console.warn(`[cidituc] perfil no obtenido — ${resumen}${enDesarrollo && detalle ? `: ${detalle}` : ""}`);
}

/**
 * Se toma sólo lo que necesitamos.
 *
 * La respuesta de CIDITUC trae bastante más, incluidos permisos sobre otros
 * sistemas municipales que no nos corresponde guardar ni mirar.
 */
function normalizar(respuesta: unknown): PerfilCidituc | null {
  if (!respuesta || typeof respuesta !== "object") return null;

  // ⚠️ Cada endpoint del backend envuelve la persona con una clave distinta, y
  // esto ya nos costó una sesión de depuración:
  //
  //   /usuarios/authStatus    → { usuarioSinContraseña: { ...persona } }
  //   /usuarios/authStatusIA  → { user: { ...persona } }
  //
  // Nosotros llamamos al primero —es el de ciudadanos; el segundo exige ser
  // empleado del municipio y devolvería 401 a un becario—. Se aceptan las dos
  // formas y la plana por si alguna versión del backend cambia, porque el precio
  // de equivocarse es un "no pudimos consultar tus datos" sin más explicación.
  const contenedor = respuesta as Record<string, unknown>;
  const persona = (contenedor.usuarioSinContraseña ??
    contenedor.user ??
    contenedor) as Record<string, unknown>;

  /**
   * Acepta texto **o número**, y devuelve texto.
   *
   * No es indulgencia gratuita: el backend consulta MySQL con `SELECT p.*`, y una
   * columna numérica llega como número de JavaScript. Exigir `typeof === "string"`
   * hacía que un documento guardado como entero se descartara en silencio, y el
   * ingreso fallaba con "no pudimos consultar tus datos" sin más pista.
   */
  const texto = (valor: unknown): string | null => {
    if (typeof valor === "number" && Number.isFinite(valor)) return String(valor);
    return typeof valor === "string" && valor.trim() !== "" ? valor.trim() : null;
  };

  const documento = texto(persona.documento_persona);
  const idPersona = Number(persona.id_persona);

  if (!documento || !Number.isFinite(idPersona)) return null;

  return {
    idPersona,
    documento,
    nombre: texto(persona.nombre_persona) ?? "",
    apellido: texto(persona.apellido_persona) ?? "",
    email: texto(persona.email_persona),
    telefono: texto(persona.telefono_persona)
  };
}
