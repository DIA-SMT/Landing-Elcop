/**
 * Auditoría de accesibilidad del sitio.
 *
 * Recorre las páginas en varios anchos y verifica lo que el proyecto se
 * comprometió a sostener. Lo importante: **el contraste se mide contra el fondo
 * efectivo**, subiendo por el árbol hasta encontrar un color opaco, y no contra
 * un blanco supuesto. Esa diferencia es la que encontró tres fallas heredadas
 * del sistema de diseño municipal.
 *
 * Uso:
 *   node herramientas/auditar.mjs [http://localhost:3000]
 *   node herramientas/auditar.mjs --portal
 *
 * Con `--portal` audita las pantallas de adentro del portal, que exigen sesión.
 * La cookie la firma `sesion-dev.mjs` y se inyecta en el navegador: sin eso, en
 * `/portal` se mediría la pantalla de ingreso y no el panel, que es lo que pasó
 * hasta que Mentorías obligó a resolverlo.
 *
 * Necesita el servidor corriendo y puppeteer-core:
 *   npm i --no-save puppeteer-core
 *
 * ⚠ No cubre el texto sobre el video del hero: la función mira el color de
 * fondo del DOM y no ve el video que hay detrás, así que ahí siempre va a decir
 * que está todo bien. Ese contraste se calculó a mano midiendo los fotogramas
 * reales; está explicado en components/home/Hero.tsx.
 */
import { existsSync } from "node:fs";
import puppeteer from "puppeteer-core";

import {
  avisarSiFaltanDatos,
  cargarEntorno,
  cookieDeSesion,
  primerDocumentoDelComite
} from "./sesion-dev.mjs";

const CON_PORTAL = process.argv.includes("--portal");
const CON_COMITE = process.argv.includes("--comite");
const CON_SESION = CON_PORTAL || CON_COMITE;
// Los flags se filtran para que `--portal` no se tome por la URL base.
const BASE = process.argv.slice(2).find((a) => !a.startsWith("--")) ?? "http://localhost:3000";

// Sin sesión, `/portal` es la pantalla de ingreso: entra en el recorrido
// público. Las de adentro sólo se pueden medir con la cookie puesta.
//
// `--comite` necesita además la cookie de alguien con ese rol: con la del
// becario, /comite responde 404 y se mediría la página de error.
const RUTAS = CON_COMITE
  ? ["/comite", "/comite/28111222"]
  : CON_PORTAL
    ? ["/portal", "/portal/clases", "/portal/mentorias", "/portal/proyecto"]
    : ["/", "/publicaciones", "/portal"];
const ANCHOS = [360, 768, 1440];

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

/** Se ejecuta dentro de la página. */
const auditar = () => {
  const lineal = (canal) => {
    const c = canal / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  const luminancia = ([r, g, b]) => 0.2126 * lineal(r) + 0.7152 * lineal(g) + 0.0722 * lineal(b);
  const numeros = (texto) => (texto.match(/[\d.]+/g) || []).map(Number);

  // Sube por el árbol hasta encontrar un fondo opaco. Sin esto, un elemento
  // con fondo transparente se compararía contra la nada.
  const fondoDe = (el) => {
    let nodo = el;
    while (nodo && nodo !== document.documentElement) {
      const fondo = numeros(getComputedStyle(nodo).backgroundColor);
      if (fondo.length >= 3 && (fondo[3] === undefined || fondo[3] > 0.85)) return fondo.slice(0, 3);
      nodo = nodo.parentElement;
    }
    return [255, 255, 255];
  };

  const contraste = (a, b) => {
    const la = luminancia(a);
    const lb = luminancia(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
  };

  const fallasContraste = [];
  const textoChico = [];
  const tactilesChicos = [];

  document.querySelectorAll("*").forEach((el) => {
    const caja = el.getBoundingClientRect();
    const estilo = getComputedStyle(el);
    const visible =
      caja.width > 0 && caja.height > 0 && estilo.visibility !== "hidden" && estilo.opacity !== "0";

    // Sólo el texto propio del elemento, no el de sus hijos.
    const propio = [...el.childNodes]
      .filter((n) => n.nodeType === 3)
      .map((n) => n.textContent.trim())
      .join("");

    if (propio && visible) {
      const px = parseFloat(estilo.fontSize);
      const peso = Number(estilo.fontWeight) || 400;
      if (px < 10) textoChico.push(`${String(el.className).slice(0, 40)} = ${px}px`);

      // WCAG: el texto grande se conforma con 3:1.
      const minimo = px >= 24 || (px >= 18.66 && peso >= 700) ? 3 : 4.5;
      const razon = contraste(numeros(estilo.color).slice(0, 3), fondoDe(el));
      if (razon < minimo) {
        fallasContraste.push(
          `${String(el.className).slice(0, 40)} = ${razon.toFixed(2)}:1 (mínimo ${minimo})`
        );
      }
    }

    // El enlace de salto es sr-only hasta recibir foco; ahí sí mide 44px.
    const esSaltoDeContenido = el.classList.contains("sr-only");
    if (
      visible &&
      !esSaltoDeContenido &&
      el.matches("a, button, input, select, textarea") &&
      !el.closest("footer") &&
      caja.height < 44
    ) {
      tactilesChicos.push(
        `${el.tagName} "${(el.textContent || "").trim().slice(0, 24)}" = ${Math.round(caja.height)}px`
      );
    }
  });

  const niveles = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].map((h) => Number(h.tagName[1]));
  const saltos = niveles.filter((n, i) => i > 0 && n > niveles[i - 1] + 1).length;

  return {
    desborde: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    h1: document.querySelectorAll("h1").length,
    saltosDeNivel: saltos,
    contraste: [...new Set(fallasContraste)],
    textoChico: [...new Set(textoChico)],
    tactilesChicos: [...new Set(tactilesChicos)]
  };
};

const navegador = await puppeteer.launch({
  executablePath: chrome,
  headless: "new",
  args: ["--hide-scrollbars", "--disable-gpu"]
});

let fallaron = 0;

if (CON_SESION) {
  cargarEntorno();
  avisarSiFaltanDatos();
}

const documentoDeLaSesion = CON_COMITE ? primerDocumentoDelComite() : undefined;

for (const ruta of RUTAS) {
  for (const ancho of ANCHOS) {
    const pagina = await navegador.newPage();
    await pagina.setViewport({ width: ancho, height: 900 });
    if (CON_SESION) {
      await pagina.setCookie(
        cookieDeSesion(BASE, documentoDeLaSesion ? { documento: documentoDeLaSesion } : undefined)
      );
    }
    await pagina.goto(`${BASE}${ruta}`, { waitUntil: "networkidle0" });
    const r = await pagina.evaluate(auditar);

    const problemas =
      r.contraste.length +
      r.textoChico.length +
      r.tactilesChicos.length +
      r.saltosDeNivel +
      r.desborde +
      (r.h1 === 1 ? 0 : 1);

    if (problemas > 0) fallaron += problemas;
    console.log(`${problemas === 0 ? "OK   " : "FALLA"} ${ruta} @${ancho}  ${JSON.stringify(r)}`);
    await pagina.close();
  }
}

await navegador.close();
process.exit(fallaron > 0 ? 1 : 0);
