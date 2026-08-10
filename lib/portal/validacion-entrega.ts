/**
 * Reglas del proyecto final.
 *
 * Módulo puro, sin dependencias de servidor ni de cliente, porque lo usan los
 * dos: el formulario para avisar antes de enviar y el endpoint para decidir.
 * **La validación que cuenta es la del servidor.**
 *
 * Hay dos niveles y la diferencia es el punto del diseño:
 *
 * - **Guardar borrador** sólo comprueba techos. Un borrador incompleto es lo
 *   normal: nadie escribe cinco secciones de una sentada, y si guardar exigiera
 *   tenerlo todo, la persona escribiría en otra parte y pegaría al final —que es
 *   la forma de perder trabajo—.
 * - **Presentar** exige todo. Después de presentar, la entrega se evalúa.
 */
import { SECCIONES_PROYECTO, type SeccionProyecto } from "./tipos";

export const LIMITES_ENTREGA = {
  titulo: { minimo: 10, maximo: 160 },
  resumen: { minimo: 100, maximo: 1200 },
  /** Mismo rango para las cinco secciones: ninguna es más importante. */
  seccion: { minimo: 200, maximo: 4000 }
} as const;

/**
 * Qué se pide en cada sección, en la palabra de quien escribe.
 *
 * Fuente única: la usan el formulario y los mensajes de error, así que no puede
 * haber dos nombres para lo mismo.
 *
 * TODO: confirmar con ELCOP. Las preguntas son nuestras; los campos salen del
 * prototipo.
 */
export const SECCIONES: Record<SeccionProyecto, { titulo: string; ayuda: string }> = {
  problema: {
    titulo: "El problema",
    ayuda: "Qué problema concreto de la ciudad aborda tu proyecto, y a quiénes afecta."
  },
  diagnostico: {
    titulo: "El diagnóstico",
    ayuda: "En qué evidencia te apoyás: datos, entrevistas, observación, antecedentes."
  },
  propuesta: {
    titulo: "La propuesta",
    ayuda: "Qué se hace concretamente, en qué orden y a cargo de quién."
  },
  presupuesto: {
    titulo: "Los recursos",
    ayuda: "Qué hace falta para llevarlo adelante: dinero, personal, equipamiento, tiempo."
  },
  viabilidad: {
    titulo: "La viabilidad",
    ayuda: "Por qué es realizable en la ciudad, y qué podría trabar la implementación."
  }
};

export type CampoEntrega = "titulo" | "resumen" | SeccionProyecto;

export type ErroresEntrega = Partial<Record<CampoEntrega, string>> & {
  /** Problema que no es de un campo: la fecha límite, por ejemplo. */
  general?: string;
};

export type BorradorEntrega = {
  titulo: string;
  resumen: string;
  secciones: Record<SeccionProyecto, string>;
};

const largo = (valor: string) => valor.trim().length;

/** Sólo los techos. Sirve para guardar sin haber terminado. */
export function validarBorrador(datos: BorradorEntrega): ErroresEntrega {
  const errores: ErroresEntrega = {};

  if (largo(datos.titulo) > LIMITES_ENTREGA.titulo.maximo) {
    errores.titulo = `El título es muy largo: hasta ${LIMITES_ENTREGA.titulo.maximo} caracteres.`;
  }
  if (largo(datos.resumen) > LIMITES_ENTREGA.resumen.maximo) {
    errores.resumen = `El resumen es muy largo: hasta ${LIMITES_ENTREGA.resumen.maximo} caracteres.`;
  }

  for (const seccion of SECCIONES_PROYECTO) {
    if (largo(datos.secciones[seccion] ?? "") > LIMITES_ENTREGA.seccion.maximo) {
      errores[seccion] =
        `${SECCIONES[seccion].titulo} se pasó del máximo de ${LIMITES_ENTREGA.seccion.maximo} caracteres.`;
    }
  }

  return errores;
}

/** Todo completo y dentro de rango. Es lo que se exige para presentar. */
export function validarPresentacion(datos: BorradorEntrega): ErroresEntrega {
  const errores = validarBorrador(datos);

  const titulo = largo(datos.titulo);
  if (titulo === 0) {
    errores.titulo = "Ponele un título al proyecto.";
  } else if (titulo < LIMITES_ENTREGA.titulo.minimo) {
    errores.titulo = `El título es muy corto: al menos ${LIMITES_ENTREGA.titulo.minimo} caracteres.`;
  }

  const resumen = largo(datos.resumen);
  if (resumen === 0) {
    errores.resumen = "Escribí el resumen: es lo primero que lee quien evalúa.";
  } else if (resumen < LIMITES_ENTREGA.resumen.minimo) {
    errores.resumen = `Faltan ${LIMITES_ENTREGA.resumen.minimo - resumen} caracteres para el mínimo del resumen.`;
  }

  for (const seccion of SECCIONES_PROYECTO) {
    if (errores[seccion]) continue;
    const actual = largo(datos.secciones[seccion] ?? "");
    if (actual === 0) {
      errores[seccion] = `Falta completar ${SECCIONES[seccion].titulo.toLowerCase()}.`;
    } else if (actual < LIMITES_ENTREGA.seccion.minimo) {
      errores[seccion] = `Faltan ${LIMITES_ENTREGA.seccion.minimo - actual} caracteres para el mínimo.`;
    }
  }

  return errores;
}

export function hayErrores(errores: ErroresEntrega): boolean {
  return Object.keys(errores).length > 0;
}

/**
 * Cuántas secciones están completas, para mostrar el avance.
 *
 * Cuenta el título y el resumen como dos más, así el avance refleja lo que
 * falta de verdad para poder presentar.
 */
export function avanceDeEntrega(datos: BorradorEntrega): { completas: number; total: number } {
  const completas = [
    largo(datos.titulo) >= LIMITES_ENTREGA.titulo.minimo,
    largo(datos.resumen) >= LIMITES_ENTREGA.resumen.minimo,
    ...SECCIONES_PROYECTO.map(
      (s) => largo(datos.secciones[s] ?? "") >= LIMITES_ENTREGA.seccion.minimo
    )
  ].filter(Boolean).length;

  return { completas, total: SECCIONES_PROYECTO.length + 2 };
}

/* -------------------------------------------------------------------------- */
/* Observaciones del comité                                                   */
/* -------------------------------------------------------------------------- */

export const LIMITES_OBSERVACIONES = { minimo: 30, maximo: 3000 } as const;

/**
 * Valida las observaciones con que el comité devuelve una entrega.
 *
 * El mínimo no es capricho: una devolución de tres palabras deja a la persona
 * sin saber qué corregir, y el estado `observado` le bloquea la aprobación
 * mientras no rehaga algo que no entiende.
 */
export function validarObservaciones(texto: string): string | null {
  const actual = texto.trim().length;
  if (actual === 0) return "Escribí la devolución: es lo único que la persona va a leer.";
  if (actual < LIMITES_OBSERVACIONES.minimo) {
    return `Muy corta: al menos ${LIMITES_OBSERVACIONES.minimo} caracteres, para que se entienda qué corregir.`;
  }
  if (actual > LIMITES_OBSERVACIONES.maximo) {
    return `Te pasaste del máximo de ${LIMITES_OBSERVACIONES.maximo} caracteres.`;
  }
  return null;
}

/** Un borrador vacío, para arrancar el formulario. */
export function borradorVacio(): BorradorEntrega {
  return {
    titulo: "",
    resumen: "",
    secciones: Object.fromEntries(SECCIONES_PROYECTO.map((s) => [s, ""])) as Record<
      SeccionProyecto,
      string
    >
  };
}
