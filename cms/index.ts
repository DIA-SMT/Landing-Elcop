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
 * El Portal del Becario ya está modelado, siguiendo las cinco secciones del
 * prototipo: Dashboard, Mis Clases, Mentorías, Proyecto Final y Mi Beca. Lo
 * que el Dashboard muestra no es una colección aparte: el porcentaje de
 * asistencia, la condición de regularidad y el conteo de consultas pendientes
 * se calculan a partir de las otras. Guardarlos sería tener dos versiones del
 * mismo número.
 */

import type { CollectionConfig, GlobalConfig } from "payload";

import { Actas } from "./colecciones/Actas";
import { Asistencias } from "./colecciones/Asistencias";
import { Consultas } from "./colecciones/Consultas";
import { Ejes } from "./colecciones/Ejes";
import { Encuentros } from "./colecciones/Encuentros";
import { Entregas } from "./colecciones/Entregas";
import { Materiales } from "./colecciones/Materiales";
import { SesionesMentoria } from "./colecciones/SesionesMentoria";
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
  Postulaciones,
  // Cursada
  Encuentros,
  Asistencias,
  Materiales,
  SesionesMentoria,
  Consultas,
  // Portal del becario
  Entregas,
  Actas
];

export const globales: GlobalConfig[] = [
  Escuela,
  Inicio,
  Institucional,
  Inscripciones,
  Pie
];

export {
  conSesion,
  cualquiera,
  docenteOEquipo,
  equipoElcop,
  portal,
  propioOEquipo,
  soloAdmin,
  subidoPorMiOEquipo
} from "./acceso";
export type { Rol } from "./acceso";
