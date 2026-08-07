/**
 * Ingreso con CIDITUC (Ciudadano Digital de la Municipalidad de SMT).
 *
 * El flujo, adaptado del que ya usa educacivil-HubIA:
 *
 *   1. El botón manda a la persona al login de CIDITUC con `?next=`.
 *   2. CIDITUC la autentica **en su propio dominio** y vuelve a nuestro
 *      callback con `?auth=<token>`.
 *   3. Le pedimos el perfil a su backend con ese token. Esa llamada valida la
 *      firma del lado de ellos y nos devuelve el documento.
 *   4. Comprobamos que ese documento sea el de un becario seleccionado.
 *   5. Emitimos nuestra propia cookie de sesión.
 *
 * **Por qué no verificamos la firma acá.** Podríamos: el token es HS256 y
 * bastaría con tener el `JWT_SECRET_KEY` de CIDITUC. Pero esa clave firma los
 * tokens de las doce aplicaciones del municipio, y quien la tiene puede
 * fabricar uno válido para cualquiera de ellas haciéndose pasar por cualquier
 * vecino. Como la consulta del perfil es obligatoria de todos modos —sin el
 * documento no hay forma de autorizar— y esa consulta ya valida la firma,
 * guardarla no agregaría ninguna comprobación: sólo sumaría un secreto muy
 * pesado a nuestras variables de entorno.
 *
 * Lo importante del paso 2: **la contraseña nunca toca este sitio.** Se escribe
 * únicamente en el dominio de CIDITUC.
 *
 * Y lo importante del paso 5: **CIDITUC autentica, nosotros autorizamos.** Su
 * token prueba que alguien es quien dice ser, no que tenga derecho a entrar
 * acá. Como el secreto de firma es compartido entre todas las aplicaciones del
 * municipio y el token no dice para cuál fue emitido, uno emitido para otra app
 * es indistinguible del nuestro: sin el paso 5, cualquier vecino con cuenta
 * entraría al portal de los becarios.
 *
 * Se usa Web Crypto y no `jsonwebtoken` para que esto funcione igual en el
 * runtime de Node de los route handlers y en el de Edge, sin sumar dependencias.
 */

/** Nombre de nuestra cookie de sesión. */
export const COOKIE_SESION = "elcop_sesion";

/** Cuánto dura nuestra sesión. Acompaña la del token de CIDITUC. */
export const DURACION_SESION_SEGUNDOS = 60 * 60 * 24;

/**
 * Lo que guardamos en la cookie.
 *
 * No se guarda el token de CIDITUC. Después del ingreso no necesitamos volver a
 * llamar a su backend, y conservarlo sólo ampliaría lo que se pierde si la
 * cookie se filtra: ese token sirve en todas las aplicaciones del municipio,
 * no sólo en esta.
 */
export type SesionElcop = {
  /** `id_persona` en CIDITUC. */
  idPersona: number;
  documento: string;
  nombre: string;
  /** Id del becario en nuestra base. */
  becarioId: string;
  /** Marca de origen, para no confundir esta cookie con otra. */
  origen: "cidituc";
  /** Vencimiento, en segundos desde epoch. */
  exp: number;
};

function secretoDeSesion(): string {
  const secreto = process.env.ELCOP_SESSION_SECRET;
  if (!secreto || secreto.length < 32) {
    throw new Error(
      "Falta ELCOP_SESSION_SECRET, o es demasiado corto (mínimo 32 caracteres). Generá uno con: openssl rand -hex 32"
    );
  }
  return secreto;
}

/* -------------------------------------------------------------------------- */
/* base64url                                                                  */
/* -------------------------------------------------------------------------- */

function aBase64Url(bytes: Uint8Array): string {
  let binario = "";
  for (const byte of bytes) binario += String.fromCharCode(byte);
  return btoa(binario).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function desdeBase64Url(valor: string): Uint8Array {
  const normalizado = valor.replace(/-/g, "+").replace(/_/g, "/");
  const binario = atob(normalizado + "=".repeat((4 - (normalizado.length % 4)) % 4));
  const bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i);
  return bytes;
}

function codificar(valor: unknown): string {
  return aBase64Url(new TextEncoder().encode(JSON.stringify(valor)));
}

async function importarClave(secreto: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secreto),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

/* -------------------------------------------------------------------------- */
/* Nuestra sesión                                                             */
/* -------------------------------------------------------------------------- */

export async function firmarSesion(
  datos: Omit<SesionElcop, "origen" | "exp">,
  duracionSegundos = DURACION_SESION_SEGUNDOS
): Promise<string> {
  const cuerpo: SesionElcop = {
    ...datos,
    origen: "cidituc",
    exp: Math.floor(Date.now() / 1000) + duracionSegundos
  };
  const entrada = `${codificar({ alg: "HS256", typ: "JWT" })}.${codificar(cuerpo)}`;
  const firma = await crypto.subtle.sign(
    "HMAC",
    await importarClave(secretoDeSesion()),
    new TextEncoder().encode(entrada)
  );
  return `${entrada}.${aBase64Url(new Uint8Array(firma))}`;
}

export async function verificarSesion(token: string | undefined | null): Promise<SesionElcop | null> {
  if (!token) return null;
  const partes = token.split(".");
  if (partes.length !== 3) return null;
  const [encabezado, cuerpo, firma] = partes;

  try {
    const valida = await crypto.subtle.verify(
      "HMAC",
      await importarClave(secretoDeSesion()),
      desdeBase64Url(firma),
      new TextEncoder().encode(`${encabezado}.${cuerpo}`)
    );
    if (!valida) return null;

    const datos = JSON.parse(new TextDecoder().decode(desdeBase64Url(cuerpo))) as SesionElcop;
    if (datos.origen !== "cidituc") return null;
    if (typeof datos.exp !== "number" || datos.exp < Math.floor(Date.now() / 1000)) return null;
    return datos;
  } catch {
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/* El token de CIDITUC                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Descarta lo que ni siquiera tiene forma de token, antes de salir a la red.
 *
 * No prueba nada y no reemplaza a nada: quien valida la firma es el backend de
 * CIDITUC. Sirve para no hacerle una consulta por cada cadena de basura que
 * alguien pegue en la URL.
 */
export function pareceUnToken(valor: string | null | undefined): valor is string {
  if (!valor) return false;
  const partes = valor.split(".");
  return partes.length === 3 && partes.every((parte) => parte.length > 0);
}

/**
 * A dónde mandamos a la persona para que inicie sesión.
 *
 * `next` es un identificador de aplicación, no una URL: CIDITUC tiene una
 * cadena de condiciones en `src/routes/PrivateRoute.jsx` que mapea cada valor
 * conocido a una URL de vuelta fija. Si el valor no está en esa lista, cae en
 * el caso por defecto y la persona termina en el derivador de CIDITUC en vez de
 * volver acá.
 *
 * Por eso tampoco se manda a dónde volver dentro del sitio: CIDITUC reenvía
 * únicamente el parámetro `auth` y descarta cualquier otro.
 */
export function urlDeIngreso(): string {
  const base = process.env.NEXT_PUBLIC_CIDITUC_LOGIN_URL;
  if (!base) throw new Error("Falta NEXT_PUBLIC_CIDITUC_LOGIN_URL.");
  const identificador = process.env.NEXT_PUBLIC_CIDITUC_APP_ID ?? "elcop";
  // CIDITUC usa HashRouter: la query va después del hash, así que no se puede
  // armar con URLSearchParams sobre la URL completa.
  const separador = base.includes("?") ? "&" : "?";
  return `${base}${separador}next=${encodeURIComponent(identificador)}`;
}
