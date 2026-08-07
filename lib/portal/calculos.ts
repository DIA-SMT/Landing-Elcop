/**
 * Los cálculos del panel.
 *
 * Nada de esto se guarda: se deriva de los encuentros y las asistencias cada
 * vez. Guardar el porcentaje sería tener dos versiones del mismo número, y la
 * segunda siempre termina desfasada respecto de la primera.
 */
import type { Asistencia, Encuentro, DatosDelPortal } from "./tipos";

/** El piso de asistencia para mantener la regularidad. */
export const MINIMO_ASISTENCIA = 75;

export type Regularidad = {
  /** Porcentaje sobre los encuentros que computan. `null` si todavía no hubo. */
  porcentaje: number | null;
  presentes: number;
  computables: number;
  justificadas: number;
  esRegular: boolean;
};

/**
 * ¿Este encuentro entra en el cálculo del 75%?
 *
 * Sólo los presenciales, y sólo los que efectivamente se dictaron. Los
 * virtuales existen en el calendario pero no suman ni restan, y los cancelados
 * salen del denominador: si una clase se cae, no puede jugar en contra de la
 * regularidad de nadie.
 */
export function computaParaAsistencia(encuentro: Encuentro): boolean {
  return encuentro.modalidad === "presencial" && encuentro.estado === "dictado";
}

/**
 * Calcula la regularidad.
 *
 * Las ausencias justificadas salen del denominador: no cuentan como presencia
 * ni juegan en contra. Es el tratamiento habitual de una falta excusada, pero
 * es un supuesto nuestro.
 *
 * TODO: confirmar con ELCOP cómo se computan las justificadas. Si en cambio
 * contaran como presentes, se suman a `presentes` en vez de descontarse.
 */
export function calcularRegularidad(
  encuentros: Encuentro[],
  asistencias: Asistencia[]
): Regularidad {
  const computables = encuentros.filter(computaParaAsistencia);
  const porEncuentro = new Map(asistencias.map((a) => [a.encuentroId, a]));

  let presentes = 0;
  let justificadas = 0;

  for (const encuentro of computables) {
    const asistencia = porEncuentro.get(encuentro.id);
    if (asistencia?.estado === "presente") presentes++;
    else if (asistencia?.estado === "justificada") justificadas++;
  }

  const base = computables.length - justificadas;
  const porcentaje = base > 0 ? Math.round((presentes / base) * 100) : null;

  return {
    porcentaje,
    presentes,
    computables: base,
    justificadas,
    // Sin encuentros dictados todavía nadie perdió la regularidad.
    esRegular: porcentaje === null || porcentaje >= MINIMO_ASISTENCIA
  };
}

/** El próximo encuentro programado, o `null` si no hay ninguno por delante. */
export function proximoEncuentro(encuentros: Encuentro[], ahora = new Date()): Encuentro | null {
  return (
    encuentros
      .filter((e) => e.estado === "programado" && new Date(e.comienza) >= ahora)
      .sort((a, b) => +new Date(a.comienza) - +new Date(b.comienza))[0] ?? null
  );
}

/** Los últimos encuentros dictados, del más reciente al más viejo. */
export function encuentrosRecientes(encuentros: Encuentro[], cuantos = 3): Encuentro[] {
  return encuentros
    .filter((e) => e.estado === "dictado")
    .sort((a, b) => +new Date(b.comienza) - +new Date(a.comienza))
    .slice(0, cuantos);
}

/** Resumen del estado académico que se muestra en el panel. */
export function estadoAcademico(datos: DatosDelPortal) {
  const regularidad = calcularRegularidad(datos.encuentros, datos.asistencias);
  return {
    regularidad,
    consultasPendientes: datos.consultas.filter((c) => c.estado === "pendiente").length,
    entrega: datos.entrega,
    actasPendientes: datos.actas.filter((a) => a.aceptadaEn === null).length
  };
}
