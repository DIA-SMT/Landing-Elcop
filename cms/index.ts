/**
 * Esquema de contenido de ELCOP.
 *
 * Estos archivos son la traducción a código de [`ESQUEMA.md`](../ESQUEMA.md).
 * **Todavía no están conectados**: no hay `payload.config.ts` ni base de datos,
 * porque eso depende de la Fase 1 del [`PLAN.md`](../PLAN.md) y de decisiones
 * de infraestructura que siguen abiertas. Conectarlos hoy rompería el sitio,
 * que funciona sin base de datos.
 *
 * Lo que sí hacen ya: compilar y ser revisables. Cuando se resuelva la Fase 0,
 * armar `payload.config.ts` es importar estas listas.
 *
 * Falta escribir el esquema del Portal del Becario (Fase 4): entregas,
 * calendario de encuentros, asistencia, materiales, consultas de mentoría y
 * actas. Se deja para cuando el alcance esté cerrado, que hoy depende de
 * revisar el prototipo y de la definición legal del acta compromiso.
 */

import type { CollectionConfig, GlobalConfig } from "payload";

import { Ejes } from "./colecciones/Ejes";
import { IndicadoresCiudad } from "./colecciones/IndicadoresCiudad";
import { Indicadores } from "./colecciones/Indicadores";
import { Integrantes } from "./colecciones/Integrantes";
import { Media } from "./colecciones/Media";
import { Postulaciones } from "./colecciones/Postulaciones";
import { Preguntas } from "./colecciones/Preguntas";
import { Publicaciones } from "./colecciones/Publicaciones";
import { Referentes } from "./colecciones/Referentes";
import { Usuarios } from "./colecciones/Usuarios";

import { Escuela } from "./globales/Escuela";
import { Inicio } from "./globales/Inicio";
import { Inscripciones } from "./globales/Inscripciones";
import { Institucional } from "./globales/Institucional";
import { Pie } from "./globales/Pie";

export const colecciones: CollectionConfig[] = [
  // Sistema
  Media,
  Usuarios,
  // Contenido público
  Indicadores,
  Integrantes,
  Ejes,
  Referentes,
  Preguntas,
  Publicaciones,
  IndicadoresCiudad,
  // Inscripciones
  Postulaciones
];

export const globales: GlobalConfig[] = [
  Escuela,
  Inicio,
  Institucional,
  Inscripciones,
  Pie
];

export { cualquiera, conSesion, equipoElcop, propioOEquipo, soloAdmin } from "./acceso";
export type { Rol } from "./acceso";
