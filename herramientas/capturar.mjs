/**
 * Capturas de pantalla del sitio.
 *
 * Uso:
 *   node herramientas/capturar.mjs <ancho> <salida.png> [ruta] [--completa]
 *
 * Ejemplos:
 *   node herramientas/capturar.mjs 1440 home.png / --completa
 *   node herramientas/capturar.mjs 360 movil.png / --completa
 *
 * Necesita el servidor corriendo y puppeteer-core:
 *   npm i --no-save puppeteer-core
 *
 * Dos detalles que cuestan una tarde si no se saben:
 *
 * 1. **No usar `chrome --headless --screenshot`.** Windows impone un ancho
 *    mínimo de ventana de unos 500px, así que pedir 360 devuelve una imagen de
 *    360 recortada de una maqueta de 500. Parece un desborde y no lo es.
 * 2. **Hay que desactivar el scroll suave antes de recorrer la página.** El
 *    sitio usa `scroll-behavior: smooth`; sin desactivarlo los `scrollTo` se
 *    animan, nunca se llega a cada posición y los IntersectionObserver de las
 *    secciones no llegan a disparar. El resultado son capturas con media
 *    página en blanco.
 */
import { existsSync } from "node:fs";
import puppeteer from "puppeteer-core";

const [, , anchoRaw, salida, rutaRaw, ...banderas] = process.argv;
const ancho = Number(anchoRaw);
const ruta = rutaRaw && !rutaRaw.startsWith("--") ? rutaRaw : "/";
const completa = [rutaRaw, ...banderas].includes("--completa");
const BASE = process.env.URL_BASE ?? "http://localhost:3000";

if (!ancho || !salida) {
  console.error("Uso: node herramientas/capturar.mjs <ancho> <salida.png> [ruta] [--completa]");
  process.exit(1);
}

const CANDIDATOS_CHROME = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "/usr/bin/google-chrome",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
];
const chrome = CANDIDATOS_CHROME.find((r) => existsSync(r));
if (!chrome) {
  console.error("No encontré Chrome. Agregá su ruta a CANDIDATOS_CHROME.");
  process.exit(1);
}

const navegador = await puppeteer.launch({
  executablePath: chrome,
  headless: "new",
  args: ["--hide-scrollbars", "--disable-gpu", "--autoplay-policy=no-user-gesture-required"]
});

const pagina = await navegador.newPage();
await pagina.setViewport({ width: ancho, height: 900, deviceScaleFactor: 2 });
await pagina.goto(`${BASE}${ruta}`, { waitUntil: "networkidle0", timeout: 60000 });

// Recorre la página para disparar los revelados y los contadores.
await pagina.evaluate(async () => {
  const previo = document.documentElement.style.scrollBehavior;
  document.documentElement.style.scrollBehavior = "auto";

  const paso = Math.round(window.innerHeight * 0.5);
  const alto = document.documentElement.scrollHeight;
  for (let y = 0; y <= alto; y += paso) {
    window.scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 220));
  }
  window.scrollTo(0, 0);
  await new Promise((r) => setTimeout(r, 500));
  document.documentElement.style.scrollBehavior = previo;
});
await new Promise((r) => setTimeout(r, 1500));

await pagina.screenshot({ path: salida, fullPage: completa, captureBeyondViewport: completa });
console.log(`OK ${salida} (${ancho}px${completa ? ", página completa" : ""})`);

await navegador.close();
