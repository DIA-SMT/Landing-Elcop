/**
 * Emite una sesión del portal para desarrollo.
 *
 * El problema que resuelve: las pantallas del portal exigen la cookie de
 * sesión, y esa cookie sólo la emite el callback de CIDITUC. Mientras DITEC no
 * registre ELCOP, nadie —ni quien lo desarrolla— puede ver el portal. Y con el
 * ingreso deshabilitado, `/portal` muestra "Próximamente".
 *
 * **No hay ninguna ruta de la aplicación que haga esto.** Un atajo de ingreso
 * dentro de la app sería una puerta de servicio en un sistema que custodia
 * datos personales, y dependería de acertarle al `NODE_ENV` en cada despliegue.
 * Acá la cookie se firma desde afuera y se inyecta en el navegador: la
 * aplicación no cambia y no queda nada que apagar en producción.
 *
 * La firma es la misma que hace `firmarSesion` en `lib/cidituc.ts`: HS256 sobre
 * `ELCOP_SESSION_SECRET`. El servidor la valida sin saber que salió de acá,
 * porque es una sesión legítima; lo que se saltea es CIDITUC y el padrón.
 *
 * Uso directo, para pegar la cookie a mano en el navegador:
 *   npm run sesion
 *   node herramientas/sesion-dev.mjs 31999888   → como esa persona
 *
 * El documento importa: si está en ELCOP_COMITE_PROVISORIO, la sesión llega a
 * /comite; si sólo está en el padrón, no. Es la forma de probar los permisos.
 *
 * Lo usan `ver-portal.mjs` y `auditar.mjs --portal`.
 */
import { createHmac } from "node:crypto";
import { existsSync } from "node:fs";

/** El nombre de la cookie, igual que `COOKIE_SESION` en lib/cidituc.ts. */
export const COOKIE_SESION = "elcop_sesion";

/** Un día, igual que `DURACION_SESION_SEGUNDOS`. */
export const DURACION_SESION_SEGUNDOS = 60 * 60 * 24;

/**
 * Carga `.env.local` al entorno del proceso.
 *
 * `loadEnvFile` respeta las comillas, que acá importan: la URL de login de
 * CIDITUC lleva un `#` y sin comillas se cortaría como comentario.
 */
export function cargarEntorno(ruta = ".env.local") {
  if (!existsSync(ruta)) {
    throw new Error(`No encontré ${ruta}. Copiá .env.example y completalo.`);
  }
  process.loadEnvFile(ruta);
}

/** Lee el secreto con la misma exigencia que la aplicación. */
export function secretoDeSesion() {
  const secreto = process.env.ELCOP_SESSION_SECRET;
  if (!secreto || secreto.length < 32) {
    throw new Error(
      "Falta ELCOP_SESSION_SECRET en .env.local, o es más corto que 32 caracteres."
    );
  }
  return secreto;
}

const aBase64Url = (dato) => Buffer.from(dato).toString("base64url");

/**
 * Firma una sesión igual que `firmarSesion`.
 *
 * El becario por defecto es el primero del padrón provisorio, así que la sesión
 * corresponde a alguien que el padrón habilitaría de verdad. `becarioId` es el
 * documento normalizado, que es lo que hoy usa `buscarBecarioPorDocumento`.
 */
export function firmarSesionDev({
  documento = primerDocumentoDelPadron(),
  nombre = "Becario de prueba",
  idPersona = 1,
  duracionSegundos = DURACION_SESION_SEGUNDOS
} = {}) {
  const cuerpo = {
    idPersona,
    documento,
    nombre,
    becarioId: documento,
    origen: "cidituc",
    exp: Math.floor(Date.now() / 1000) + duracionSegundos
  };

  const entrada = `${aBase64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }))}.${aBase64Url(
    JSON.stringify(cuerpo)
  )}`;
  const firma = createHmac("sha256", secretoDeSesion()).update(entrada).digest();
  return `${entrada}.${aBase64Url(firma)}`;
}

/** El primer documento de `ELCOP_PADRON_PROVISORIO`. */
export function primerDocumentoDelPadron() {
  const primero = (process.env.ELCOP_PADRON_PROVISORIO ?? "").split(",")[0]?.replace(/\D/g, "");
  if (!primero) {
    throw new Error("Falta ELCOP_PADRON_PROVISORIO en .env.local: no sé por quién entrar.");
  }
  return primero;
}

/** El primer documento con rol de comité, para auditar `/comite`. */
export function primerDocumentoDelComite() {
  const primero = (process.env.ELCOP_COMITE_PROVISORIO ?? "").split(",")[0]?.replace(/\D/g, "");
  if (!primero) {
    throw new Error(
      "Falta ELCOP_COMITE_PROVISORIO en .env.local: sin rol de comité, /comite responde 404."
    );
  }
  return primero;
}

/** La cookie lista para `page.setCookie` de puppeteer. */
export function cookieDeSesion(base, opciones) {
  const { hostname } = new URL(base);
  return {
    name: COOKIE_SESION,
    value: firmarSesionDev(opciones),
    domain: hostname,
    path: "/",
    httpOnly: true,
    secure: false,
    sameSite: "Lax"
  };
}

/**
 * Avisa si el portal va a verse vacío.
 *
 * Sin `PORTAL_DATOS_DEMO` las listas vienen vacías, que es el estado correcto
 * mientras no haya base —y es lo que un becario ve el primer día—, pero si lo
 * que se quiere es mirar las pantallas, el vacío se confunde con una falla.
 */
export function avisarSiFaltanDatos() {
  if (process.env.PORTAL_DATOS_DEMO !== "true") {
    console.warn(
      "⚠ PORTAL_DATOS_DEMO no está en true: las pantallas van a aparecer vacías.\n" +
        "  Ponelo en true en .env.local para ver los datos de ejemplo."
    );
  }
}

// Ejecutado directamente: imprime la cookie para pegarla a mano.
if (import.meta.filename === process.argv[1]) {
  cargarEntorno();
  const pedido = process.argv.slice(2).find((a) => /^\d[\d.\s]*$/.test(a));
  const documento = pedido ? pedido.replace(/\D/g, "") : primerDocumentoDelPadron();
  console.log(
    `Documento ${documento}${pedido ? "" : " (primero del padrón provisorio)"}`
  );
  console.log(`Vence: en ${DURACION_SESION_SEGUNDOS / 3600} horas\n`);
  console.log(`${COOKIE_SESION}=${firmarSesionDev({ documento })}\n`);
  console.log(
    "Para usarla: DevTools → Application → Cookies → http://localhost:3000,\n" +
      "y pegá ese nombre y valor. O corré `node herramientas/ver-portal.mjs`,\n" +
      "que abre el navegador con la sesión ya puesta."
  );
  avisarSiFaltanDatos();
}
