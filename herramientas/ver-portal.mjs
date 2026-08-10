/**
 * Abre el portal en un navegador con la sesión ya puesta.
 *
 * Es la forma de mirar las pantallas del portal mientras CIDITUC no reconozca a
 * ELCOP. Sin esto, `/portal` muestra "Próximamente" y no hay manera de llegar al
 * panel: la cookie la emite el callback, y el callback necesita a CIDITUC.
 *
 * Uso, con `npm run dev` corriendo en otra terminal:
 *
 *   npm run portal                                      → /portal
 *   node herramientas/ver-portal.mjs portal/proyecto    → esa pantalla
 *
 * **La ruta va sin barra inicial.** En Git Bash sobre Windows, un argumento que
 * empieza con `/` se convierte en una ruta del sistema —`/portal` termina como
 * `C:/Program Files/Git/portal`— y se pide la página equivocada. Con barra
 * también funciona en PowerShell y en Linux, y si la conversión ocurre el script
 * lo detecta y lo dice en vez de fallar de forma confusa.
 *
 * Necesita el servidor corriendo (`npm run dev`) y puppeteer-core:
 *   npm i --no-save puppeteer-core
 *
 * La ventana queda abierta y navegable. Se cierra con Ctrl+C o cerrándola.
 */
import { existsSync } from "node:fs";
import puppeteer from "puppeteer-core";

import { avisarSiFaltanDatos, cargarEntorno, cookieDeSesion } from "./sesion-dev.mjs";

const argumentos = process.argv.slice(2).filter((a) => !a.startsWith("--"));

/**
 * Deja la ruta como `/algo`, y frena si el shell la convirtió en una ruta del
 * sistema. Sin esta comprobación, Git Bash pide `/C:/Program Files/Git/portal`
 * y el error que se ve es "no pude abrir", que manda a revisar el servidor
 * cuando el problema estaba en el argumento.
 */
function normalizarRuta(valor) {
  if (!valor) return "/portal";
  if (/^[A-Za-z]:[\\/]/.test(valor)) {
    console.error(
      `El shell convirtió la ruta en "${valor}".\n` +
        "Es la conversión de rutas de Git Bash. Pasala sin la barra inicial:\n" +
        "  node herramientas/ver-portal.mjs portal/mentorias"
    );
    process.exit(1);
  }
  return valor.startsWith("/") ? valor : `/${valor}`;
}

const RUTA = normalizarRuta(argumentos[0]);
const BASE = argumentos[1] ?? "http://localhost:3000";

const CANDIDATOS_CHROME = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "/usr/bin/google-chrome",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
];

const chrome = CANDIDATOS_CHROME.find((ruta) => existsSync(ruta));
if (!chrome) {
  console.error("No encontré Chrome. Agregá su ruta a CANDIDATOS_CHROME.");
  process.exit(1);
}

cargarEntorno();
avisarSiFaltanDatos();

const navegador = await puppeteer.launch({
  executablePath: chrome,
  headless: false,
  defaultViewport: null,
  args: ["--window-size=1440,900"]
});

const [pagina] = await navegador.pages();
await pagina.setCookie(cookieDeSesion(BASE));

try {
  await pagina.goto(`${BASE}${RUTA}`, { waitUntil: "domcontentloaded" });
} catch {
  console.error(
    `No pude abrir ${BASE}${RUTA}.\n` +
      "Casi siempre es que no hay servidor: abrí otra terminal y dejá corriendo\n" +
      "  npm run dev"
  );
  await navegador.close();
  process.exit(1);
}

console.log(`Abierto ${BASE}${RUTA} con sesión. Ctrl+C para cerrar.`);

// Sin esto el proceso termina y se lleva el navegador puesto.
await new Promise((resolver) => navegador.once("disconnected", resolver));
