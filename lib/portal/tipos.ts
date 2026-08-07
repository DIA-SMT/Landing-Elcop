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
  estado: EstadoConsulta;
  creadaEn: string;
  sesion: string | null;
};

export type EstadoEntrega = "sin-empezar" | "borrador" | "presentado" | "observado" | "aprobado";

export type Entrega = {
  estado: EstadoEntrega;
  titulo: string | null;
  presentadoEn: string | null;
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
  entrega: Entrega;
  actas: Acta[];
  /** `true` cuando lo que se muestra son datos de ejemplo y no reales. */
  esDemostracion: boolean;
};
