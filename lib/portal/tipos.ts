/**
 * Tipos del Portal del Becario.
 *
 * Son la traducción a TypeScript de las colecciones de [`ESQUEMA.md`](../../ESQUEMA.md)
 * §8. Cuando exista la base, estos tipos se mantienen y lo único que cambia es
 * de dónde salen los datos.
 */

export type ModalidadEncuentro = "presencial" | "virtual";
export type EstadoEncuentro = "programado" | "dictado" | "cancelado";

export type Encuentro = {
  id: string;
  titulo: string;
  modulo: string;
  eje: string;
  comienza: string;
  termina: string;
  modalidad: ModalidadEncuentro;
  estado: EstadoEncuentro;
  lugar: string | null;
  enlace: string | null;
  esMasterclass: boolean;
  referente: string | null;
};

export type EstadoAsistencia = "presente" | "ausente" | "justificada";

export type Asistencia = {
  encuentroId: string;
  estado: EstadoAsistencia;
  origen: "qr" | "manual";
  registradaEn: string;
};

export type TipoMaterial = "presentacion" | "lectura" | "bibliografia" | "otro";

export type Material = {
  id: string;
  titulo: string;
  tipo: TipoMaterial;
  modulo: string;
  encuentroId: string | null;
  descripcion: string | null;
  archivo: string;
};

export type EstadoConsulta = "pendiente" | "respondida" | "cerrada";

export type Consulta = {
  id: string;
  asunto: string;
  /** El texto de la duda, tal como lo escribió el becario. */
  texto: string;
  estado: EstadoConsulta;
  creadaEn: string;
  /** Id de la sesión a la que va dirigida, o `null` si es del canal abierto. */
  sesionId: string | null;
  /** Nombre de la sesión, para mostrar sin tener que buscarla. */
  sesion: string | null;
  respuesta: string | null;
  respondidaEn: string | null;
};

export type EstadoSesionMentoria = "programada" | "realizada" | "cancelada";

export type SesionMentoria = {
  id: string;
  titulo: string;
  mentor: string | null;
  comienza: string;
  /** Después de esta hora no se aceptan más preguntas para esta sesión. */
  cierreDeConsultas: string;
  enlace: string | null;
  estado: EstadoSesionMentoria;
};

export type EstadoEntrega = "sin-empezar" | "borrador" | "presentado" | "observado" | "aprobado";

/**
 * Las cinco secciones del proyecto final, además del título y el resumen.
 *
 * Es un formulario estructurado y no un archivo a propósito: ochenta proyectos
 * en campos comparables se evalúan, y ochenta PDF sueltos son cajas negras. El
 * razonamiento está en `ESQUEMA.md` §5.4.
 *
 * TODO: confirmar con ELCOP los campos y el largo esperado de cada uno. Salen
 * del prototipo, donde parecen venir de la rúbrica real.
 */
export const SECCIONES_PROYECTO = [
  "problema",
  "diagnostico",
  "propuesta",
  "presupuesto",
  "viabilidad"
] as const;

export type SeccionProyecto = (typeof SECCIONES_PROYECTO)[number];

export type Entrega = {
  estado: EstadoEntrega;
  titulo: string | null;
  resumen: string | null;
  /** Las cinco secciones. Vacías mientras no se escribieron. */
  secciones: Record<SeccionProyecto, string>;
  presentadoEn: string | null;
  /** Última vez que se guardó, presentada o no. */
  guardadaEn: string | null;
  /** Observaciones del comité, cuando el estado es `observado`. */
  observaciones: string | null;
};

export type Acta = {
  id: string;
  tipo: "contrato-beca" | "acta-compromiso";
  titulo: string;
  aceptadaEn: string | null;
};

/** Todo lo que el panel necesita, en una sola consulta. */
export type DatosDelPortal = {
  encuentros: Encuentro[];
  asistencias: Asistencia[];
  materiales: Material[];
  consultas: Consulta[];
  sesionesMentoria: SesionMentoria[];
  entrega: Entrega;
  actas: Acta[];
  /** `true` cuando lo que se muestra son datos de ejemplo y no reales. */
  esDemostracion: boolean;
};
