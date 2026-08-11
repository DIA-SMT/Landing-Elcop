/**
 * Carga el padrón de becarios (o el comité) en la base desde un CSV.
 *
 * Uso, desde la raíz del proyecto:
 *
 *   node herramientas/cargar-padron.mjs lista.csv            → muestra qué haría, SIN escribir
 *   node herramientas/cargar-padron.mjs lista.csv --aplicar  → escribe en la tabla becarios
 *   node herramientas/cargar-padron.mjs comite.csv --comite --aplicar
 *
 * **Sin `--aplicar` no escribe nada.** Primero se mira el resumen, después se
 * aplica: la tabla es la que decide quién entra al portal, y un CSV con una
 * columna corrida no se descubre después de pisarla.
 *
 * ## El CSV
 *
 * Con fila de encabezados. Se aceptan los nombres de columna más probables
 * (mayúsculas y tildes dan igual):
 *
 *   documento | dni | cuil          → obligatoria. Con puntos, sin puntos o CUIL:
 *                                     se normaliza igual que en el ingreso.
 *   nombre [+ apellido]             → opcional; si vienen las dos, se juntan.
 *   cohorte                         → opcional; por omisión 2026.
 *
 * Separador coma o punto y coma —el Excel argentino exporta con «;»— y
 * codificación UTF-8 o Latin-1: las dos cosas se detectan solas, porque pedirle
 * a coordinación que reexporte "en el formato correcto" es perder una semana.
 *
 * Es un upsert por documento: correrlo dos veces no duplica a nadie, y sirve
 * para completar nombres que faltaban.
 *
 * Las credenciales salen de SUPABASE_URL/SUPABASE_SECRET_KEY del entorno o de
 * .env.local. Nunca se imprimen.
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { createClient } from "@supabase/supabase-js";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/* ----------------------------- argumentos ---------------------------------- */

const argumentos = process.argv.slice(2);
const aplicar = argumentos.includes("--aplicar");
const alComite = argumentos.includes("--comite");
const archivo = argumentos.find((a) => !a.startsWith("--"));

if (!archivo) {
  console.error("Falta el archivo. Uso: node herramientas/cargar-padron.mjs lista.csv [--aplicar] [--comite]");
  process.exit(1);
}

const tabla = alComite ? "comite" : "becarios";

/* ----------------------------- credenciales -------------------------------- */

function credenciales() {
  let url = process.env.SUPABASE_URL;
  let clave = process.env.SUPABASE_SECRET_KEY;

  if (!url || !clave) {
    // El mismo .env.local que usa la aplicación. No se imprime ningún valor.
    try {
      const entorno = Object.fromEntries(
        readFileSync(resolve(RAIZ, ".env.local"), "utf8")
          .split(/\r?\n/)
          .filter((linea) => linea.includes("=") && !linea.trim().startsWith("#"))
          .map((linea) => [
            linea.slice(0, linea.indexOf("=")).trim(),
            linea.slice(linea.indexOf("=") + 1).trim().replace(/^"|"$/g, "")
          ])
      );
      url ||= entorno.SUPABASE_URL;
      clave ||= entorno.SUPABASE_SECRET_KEY;
    } catch {
      // Sin .env.local: se avisa abajo.
    }
  }

  if (!url || !clave) {
    console.error("Faltan SUPABASE_URL y SUPABASE_SECRET_KEY (en el entorno o en .env.local).");
    process.exit(1);
  }
  return { url, clave };
}

/* ------------------------------- lectura ----------------------------------- */

/** Lee el archivo detectando la codificación: UTF-8, y si aparecen caracteres
 *  de reemplazo (típico de un Excel viejo en Latin-1), se relee como Latin-1. */
function leerTexto(ruta) {
  const crudo = readFileSync(ruta);
  let texto = crudo.toString("utf8");
  if (texto.includes("�")) texto = crudo.toString("latin1");
  return texto.replace(/^﻿/, ""); // BOM de Excel
}

/** Parte una línea respetando comillas: un nombre con coma no rompe la fila. */
function parsearLinea(linea, separador) {
  const campos = [];
  let actual = "";
  let entreComillas = false;

  for (let i = 0; i < linea.length; i++) {
    const caracter = linea[i];
    if (entreComillas) {
      if (caracter === '"' && linea[i + 1] === '"') {
        actual += '"';
        i++;
      } else if (caracter === '"') entreComillas = false;
      else actual += caracter;
    } else if (caracter === '"') entreComillas = true;
    else if (caracter === separador) {
      campos.push(actual);
      actual = "";
    } else actual += caracter;
  }
  campos.push(actual);
  return campos.map((campo) => campo.trim());
}

/** Minúsculas y sin tildes, para comparar encabezados sin pelear por "Año". */
function llave(texto) {
  return texto.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();
}

/** Misma regla que `lib/padron.ts` (si cambia allá, cambiar acá):
 *  solo dígitos; un CUIL de 11 pierde prefijo y verificador; 7 u 8 es DNI. */
function normalizarDocumento(valor) {
  const digitos = (valor ?? "").replace(/\D/g, "");
  if (digitos.length === 11) return digitos.slice(2, 10);
  if (digitos.length >= 7 && digitos.length <= 8) return digitos;
  return null;
}

/* -------------------------------- parseo ------------------------------------ */

const texto = leerTexto(resolve(archivo));
const lineas = texto.split(/\r?\n/).filter((linea) => linea.trim() !== "");

if (lineas.length < 2) {
  console.error("El archivo no tiene datos: hace falta una fila de encabezados y al menos una persona.");
  process.exit(1);
}

// El separador se decide contando en el encabezado: el Excel argentino usa «;».
const separador = (lineas[0].match(/;/g) ?? []).length > (lineas[0].match(/,/g) ?? []).length ? ";" : ",";
const encabezados = parsearLinea(lineas[0], separador).map(llave);

const columna = (...nombres) => {
  const indice = encabezados.findIndex((e) => nombres.includes(e));
  return indice === -1 ? null : indice;
};

const colDocumento = columna("documento", "dni", "cuil", "doc", "nro documento", "numero de documento");
const colNombre = columna("nombre", "nombre completo", "nombre y apellido", "nombres");
const colApellido = columna("apellido", "apellidos");
const colCohorte = columna("cohorte", "año", "anio");

if (colDocumento === null) {
  console.error(`No encuentro la columna del documento. Encabezados leídos: ${encabezados.join(" | ")}`);
  console.error('Se acepta: "documento", "dni" o "cuil".');
  process.exit(1);
}

const filas = [];
const problemas = [];
const vistos = new Set();

for (let i = 1; i < lineas.length; i++) {
  const campos = parsearLinea(lineas[i], separador);
  const documento = normalizarDocumento(campos[colDocumento]);

  if (!documento) {
    problemas.push(`línea ${i + 1}: documento inválido ("${campos[colDocumento] ?? ""}")`);
    continue;
  }
  if (vistos.has(documento)) {
    problemas.push(`línea ${i + 1}: documento repetido en el archivo (termina en ...${documento.slice(-3)}); se conserva la primera aparición`);
    continue;
  }
  vistos.add(documento);

  const nombre =
    [colNombre, colApellido]
      .filter((col) => col !== null)
      .map((col) => campos[col])
      .filter(Boolean)
      .join(" ")
      .trim() || null;

  const fila = { documento, nombre };
  if (!alComite) fila.cohorte = (colCohorte !== null && campos[colCohorte]) || "2026";
  filas.push(fila);
}

/* -------------------------------- resumen ----------------------------------- */

console.log(`Archivo: ${archivo}  (separador «${separador}»)`);
console.log(`Tabla destino: ${tabla}`);
console.log(`Personas válidas: ${filas.length}  ·  con nombre: ${filas.filter((f) => f.nombre).length}`);
if (problemas.length > 0) {
  console.log(`\nFilas con problemas (${problemas.length}):`);
  for (const problema of problemas) console.log(`  - ${problema}`);
}

if (filas.length === 0) {
  console.error("\nNada para cargar.");
  process.exit(1);
}

if (!aplicar) {
  console.log("\nModo de prueba: NO se escribió nada. Para cargar de verdad, repetí con --aplicar");
  process.exit(0);
}

/* --------------------------------- carga ------------------------------------ */

const { url, clave } = credenciales();
const base = createClient(url, clave, { auth: { persistSession: false } });

const { error } = await base.from(tabla).upsert(filas, { onConflict: "documento" });
if (error) {
  console.error(`\nLa carga falló: ${error.code ?? "?"} — ${error.message}`);
  process.exit(1);
}

const { count } = await base.from(tabla).select("*", { count: "exact", head: true });
console.log(`\nCargado. La tabla ${tabla} tiene ahora ${count} personas.`);
