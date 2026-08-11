/**
 * El calendario real de la cohorte 2026.
 *
 * Fuente: el documento oficial "Calendarización para la web" que ELCOP entregó
 * en agosto de 2026. La cursada ya terminó cuando el portal salió, así que esto
 * es un registro: todo entra como `dictado`, salvo las tres suspensiones que el
 * propio documento lista, que entran como `cancelado` con su motivo de título.
 * Las fechas se verificaron contra el calendario 2026: los feriados y el
 * partido caen donde el documento dice.
 *
 * Lo que el documento NO trae, y por eso acá tampoco está:
 *
 * - **Horarios y aulas.** Se muestran sólo fechas; `lugar` queda vacío. Si ELCOP
 *   los pasa, se completan acá y nada más cambia.
 * - **El registro de asistencia.** Se deja vacío a propósito: cargar veinte
 *   clases sin asistencias haría que el panel calcule 0% para todo el mundo, y
 *   por eso `calcularRegularidad` distingue "sin registro" de "0%". Cuando la
 *   coordinación pase el registro real, se carga y el porcentaje aparece solo.
 * - **Agosto.** El cuarto mes es la elaboración del proyecto final, sin clases;
 *   el documento está completo con tres módulos.
 *
 * Las clases de comisión se dictaron jueves Y viernes —cada comisión cursó uno
 * de los dos días—, así que son UN encuentro que va de jueves a viernes, no
 * dos: si fueran dos, el denominador de la asistencia contaría el día que a la
 * persona no le tocaba. Los plenarios fueron de cohorte completa, casi todos
 * sábado, y entran con `referente` porque son los encuentros con invitados que
 * la landing presenta como masterclasses.
 *
 * TODO: cuando exista la base, esta tabla se convierte en la colección de
 * encuentros y este archivo desaparece.
 */
import type { Encuentro } from "./tipos";

/** Los tres módulos dictados, con el nombre oficial del documento. */
const MODULOS = {
  I: { modulo: "Módulo I · Mayo 2026", eje: "El Sujeto Político y la Estrategia del Mensaje" },
  II: { modulo: "Módulo II · Junio 2026", eje: "Herramientas Institucionales y Acción Comunitaria" },
  III: { modulo: "Módulo III · Julio 2026", eje: "Agendas Complejas, Negociación y Exposición" }
} as const;

type Fila = {
  /** Primer día de la clase. También es el id: no hay dos filas el mismo día. */
  fecha: string;
  /** Segundo día, sólo en las clases de comisión (jueves y viernes). */
  hasta?: string;
  modulo: keyof typeof MODULOS;
  titulo: string;
  /** Docente de la clase de comisión. Los plenarios usan `referente`. */
  docente?: string;
  /** Invitados del plenario. */
  referente?: string;
  virtual?: true;
  suspendida?: true;
};

const FILAS: Fila[] = [
  // ── Módulo I (mayo) ──────────────────────────────────────────────────────
  { fecha: "2026-05-14", hasta: "2026-05-15", modulo: "I", titulo: "Políticas públicas", docente: "Maximiliano Campos Ríos" },
  { fecha: "2026-05-16", modulo: "I", titulo: "Nuevos medios de comunicación en la política", referente: "Pablo Pérez Paladino, Malena Dip y Laureano Bielsa" },
  { fecha: "2026-05-21", hasta: "2026-05-22", modulo: "I", titulo: "Estrategia de comunicación política e institucional", docente: "Lucía Bonetto" },
  { fecha: "2026-05-23", modulo: "I", titulo: "Suspensión de clases por el fin de semana largo", suspendida: true },
  { fecha: "2026-05-28", hasta: "2026-05-29", modulo: "I", titulo: "Estrategia de mensaje: ¿qué queremos decir? Storytelling", docente: "Pablo Haro" },
  { fecha: "2026-05-30", modulo: "I", titulo: "Análisis de opinión pública", referente: "Diego Reynoso" },

  // ── Módulo II (junio) ────────────────────────────────────────────────────
  { fecha: "2026-06-04", hasta: "2026-06-05", modulo: "II", titulo: "Gestión comunitaria y ONGs", docente: "Rodrigo Karasik" },
  { fecha: "2026-06-06", modulo: "II", titulo: "Comunicación y análisis de opinión pública", referente: "Shila Vilker" },
  { fecha: "2026-06-11", hasta: "2026-06-12", modulo: "II", titulo: "Derecho constitucional", docente: "Carlos Valls" },
  { fecha: "2026-06-18", hasta: "2026-06-19", modulo: "II", titulo: "Economía local", docente: "Carolina Oliver" },
  { fecha: "2026-06-20", modulo: "II", titulo: "Feriado", suspendida: true },
  { fecha: "2026-06-25", hasta: "2026-06-26", modulo: "II", titulo: "Clase práctica de oratoria", docente: "Giselle Arena" },
  { fecha: "2026-06-27", modulo: "II", titulo: "Análisis económico · El liderazgo desde el ámbito parlamentario", referente: "Julia Strada, Romina Braga y Candelaria Pérez Abregú (CEPA)" },

  // ── Módulo III (julio) ───────────────────────────────────────────────────
  { fecha: "2026-07-02", modulo: "III", titulo: "Construcción de comunidad", referente: "María Migliore" },
  { fecha: "2026-07-03", modulo: "III", titulo: "Suspendido por partido", suspendida: true },
  { fecha: "2026-07-04", modulo: "III", titulo: "La agenda verde: ciudad sustentable y calidad de vida", referente: "Elisabeth Möhle (Fundar)" },
  { fecha: "2026-07-11", modulo: "III", titulo: "Liderazgo juvenil en la gestión local", referente: "Sofía Schiavo", virtual: true },
  { fecha: "2026-07-16", hasta: "2026-07-17", modulo: "III", titulo: "Internacionales, negociación y construcción democrática", docente: "Horacio Ravenna" },
  { fecha: "2026-07-23", hasta: "2026-07-24", modulo: "III", titulo: "Entrenamiento de medios", docente: "José Romero Silva" },
  { fecha: "2026-07-30", hasta: "2026-07-31", modulo: "III", titulo: "Transporte y logística", docente: "Julieta Daffonchio" }
];

/** Mediodía de Tucumán: sin horario real, una hora neutra que no cruza de día. */
const alMediodia = (fecha: string) => `${fecha}T12:00:00-03:00`;

/** El calendario dictado, en la forma que el portal ya sabe mostrar. */
export const CALENDARIO_2026: Encuentro[] = FILAS.map((fila) => ({
  id: fila.fecha,
  titulo: fila.titulo,
  ...MODULOS[fila.modulo],
  comienza: alMediodia(fila.fecha),
  termina: alMediodia(fila.hasta ?? fila.fecha),
  modalidad: fila.virtual ? "virtual" : "presencial",
  estado: fila.suspendida ? "cancelado" : "dictado",
  lugar: null,
  enlace: null,
  esMasterclass: Boolean(fila.referente),
  referente: fila.referente ?? null,
  docente: fila.docente ?? null
}));
