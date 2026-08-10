/**
 * Reglas de la consulta de mentoría.
 *
 * Viven en un módulo puro, sin dependencias de servidor ni de cliente, porque
 * las usan los dos: el formulario para avisar antes de enviar, y el endpoint
 * para decidir. **La validación que cuenta es la del servidor** — la del
 * cliente es cortesía, se saltea con la consola abierta.
 */

export const LIMITES_CONSULTA = {
  asunto: { minimo: 5, maximo: 120 },
  texto: { minimo: 20, maximo: 2000 }
} as const;

export type ErroresConsulta = {
  asunto?: string;
  texto?: string;
  sesionId?: string;
};

/** Valida asunto y texto. Devuelve un objeto vacío si está todo bien. */
export function validarConsulta(datos: { asunto: string; texto: string }): ErroresConsulta {
  const errores: ErroresConsulta = {};
  const asunto = datos.asunto.trim();
  const texto = datos.texto.trim();

  if (asunto.length === 0) {
    errores.asunto = "Escribí un asunto: es lo que quien mentorea ve primero.";
  } else if (asunto.length < LIMITES_CONSULTA.asunto.minimo) {
    errores.asunto = `El asunto es muy corto: al menos ${LIMITES_CONSULTA.asunto.minimo} caracteres.`;
  } else if (asunto.length > LIMITES_CONSULTA.asunto.maximo) {
    errores.asunto = `El asunto es muy largo: hasta ${LIMITES_CONSULTA.asunto.maximo} caracteres.`;
  }

  if (texto.length === 0) {
    errores.texto = "Contá tu duda: sin el detalle no hay qué responder.";
  } else if (texto.length < LIMITES_CONSULTA.texto.minimo) {
    errores.texto = `Faltan ${LIMITES_CONSULTA.texto.minimo - texto.length} caracteres para el mínimo.`;
  } else if (texto.length > LIMITES_CONSULTA.texto.maximo) {
    errores.texto = `Te pasaste del máximo de ${LIMITES_CONSULTA.texto.maximo} caracteres.`;
  }

  return errores;
}
