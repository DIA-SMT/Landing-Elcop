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
          resolver(respuesta.statusCode === 200 ? datos : null);
        });
      }
    );

    peticion.on("timeout", () => {
      peticion.destroy();
      resolver(null);
    });
    // Sin detalles del error: pueden arrastrar la URL o el token a un log.
    peticion.on("error", () => resolver(null));
    peticion.end();
  });

  if (!cuerpo) return null;

  try {
    return normalizar(JSON.parse(cuerpo));
  } catch {
    return null;
  }
}

/**
 * Se toma sólo lo que necesitamos.
 *
 * La respuesta de CIDITUC trae bastante más, incluidos permisos sobre otros
 * sistemas municipales que no nos corresponde guardar ni mirar.
 */
function normalizar(respuesta: unknown): PerfilCidituc | null {
  if (!respuesta || typeof respuesta !== "object") return null;

  // Según el endpoint, los datos vienen sueltos o anidados en `user`.
  const contenedor = respuesta as Record<string, unknown>;
  const persona = (contenedor.user ?? contenedor) as Record<string, unknown>;

  const texto = (valor: unknown): string | null =>
    typeof valor === "string" && valor.trim() !== "" ? valor.trim() : null;

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
