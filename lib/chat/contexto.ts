/**
 * El contexto que el asistente usa para responder.
 *
 * Se arma **de `content/elcop.ts`**, que ya es la única fuente de contenido del
 * proyecto. Eso no es una comodidad: es lo que evita que el bot se desactualice.
 * Si el texto del asistente fuera una copia aparte, el día que ELCOP confirme
 * una fecha habría que acordarse de cambiarla en dos lugares, y el segundo
 * siempre queda viejo.
 *
 * ## Lo que falta se declara, no se esconde
 *
 * Buena parte del contenido todavía está sin confirmar y en el código eso se ve
 * como `null` —el mail, el teléfono, las redes, la fecha de la próxima cohorte—.
 * Esta función los detecta y se los pasa al modelo como lista explícita de
 * "esto no existe todavía". Un asistente que se invente el mail institucional
 * de una escuela del municipio hace más daño que uno que diga "no lo sé".
 */
import {
  CONTACTO,
  DIPLOMATURA,
  EJES,
  ESCUELA,
  FAQ,
  INDICADORES,
  INSCRIPCIONES,
  INSTITUCIONAL,
  REDES,
  REFERENTES
} from "@/content/elcop";

/** Los datos que el sitio todavía no tiene, derivados del contenido mismo. */
function datosQueFaltan(): string[] {
  const faltan: string[] = [];

  if (!CONTACTO.email) faltan.push("el correo institucional");
  if (!CONTACTO.telefono) faltan.push("el teléfono institucional");
  if (!INSCRIPCIONES.proximaCohorte) {
    faltan.push("las fechas de la próxima cohorte, incluida la apertura de la convocatoria");
  }

  const redesSinCuenta = REDES.filter((red) => !red.href).map((red) => red.nombre);
  if (redesSinCuenta.length > 0) {
    faltan.push(`las cuentas oficiales de ${redesSinCuenta.join(", ")}`);
  }

  return faltan;
}

/**
 * El contenido de ELCOP en texto plano, para meterlo en el prompt.
 *
 * Se escribe a mano el orden y el recorte porque no todo el contenido sirve
 * acá: los textos de maqueta, los `alt` de las fotos y los datos de branding
 * sólo gastarían tokens.
 */
export function contextoDeElcop(): string {
  const bloques: string[] = [];

  bloques.push(
    `## Qué es\n${ESCUELA.nombre} (${ESCUELA.nombreCorto}), una iniciativa conjunta de ${ESCUELA.socios}. Cohorte vigente: ${ESCUELA.cohorte}.`
  );

  bloques.push(
    `## La diplomatura\n${DIPLOMATURA.titulo}. Duración: ${DIPLOMATURA.duracion}. Modalidad: ${DIPLOMATURA.modalidad}.\n${DIPLOMATURA.bajada}`
  );

  bloques.push(
    `## Los cuatro ejes\n${EJES.map(
      (eje) => `${eje.numero}. ${eje.titulo}: ${eje.descripcion} Temas: ${eje.temas.join(", ")}.`
    ).join("\n")}`
  );

  bloques.push(
    [
      "## La beca y el ingreso",
      `${INSCRIPCIONES.becaIntro} ${INSCRIPCIONES.beca}`,
      INSCRIPCIONES.etapasIntro,
      ...INSCRIPCIONES.etapas.map((e) => `Etapa ${e.numero} — ${e.titulo}: ${e.descripcion}`),
      `Cursada: ${INSCRIPCIONES.cursada.duracion}. ${INSCRIPCIONES.cursada.modalidad}. ${INSCRIPCIONES.cursada.modalidadDetalle} Requisito: ${INSCRIPCIONES.cursada.asistencia}.`,
      `Evaluación final: ${INSCRIPCIONES.evaluacionFinal.titulo}. ${INSCRIPCIONES.evaluacionFinal.descripcion}`,
      INSCRIPCIONES.cupos
    ].join("\n")
  );

  bloques.push(
    `## La cohorte en números\n${INDICADORES.map(
      (i) => `${i.valor}${i.sufijo ?? ""} ${i.etiqueta}: ${i.detalle}`
    ).join("\n")}`
  );

  bloques.push(
    `## Masterclass y referentes\n${REFERENTES.map(
      (r) => `${r.nombre} (${r.credencial}) — ${r.tema}`
    ).join("\n")}`
  );

  bloques.push(`## Institucional\n${INSTITUCIONAL.parrafos.join(" ")}`);

  bloques.push(
    `## Preguntas frecuentes\n${FAQ.map((f) => `P: ${f.pregunta}\nR: ${f.respuesta}`).join("\n\n")}`
  );

  const { institucion, calle, ciudad } = CONTACTO.direccion;
  bloques.push(`## Dónde se cursa\n${institucion}, ${calle}, ${ciudad}.`);

  return bloques.join("\n\n");
}

/**
 * Las instrucciones del asistente.
 *
 * Las reglas duras van primero y en positivo, porque es lo que mejor sigue un
 * modelo: qué hacer con lo que no sabe, antes que una lista de prohibiciones.
 */
export function instruccionesDelAsistente(): string {
  const faltan = datosQueFaltan();

  const sinConfirmar =
    faltan.length > 0
      ? `\n\nDATOS QUE TODAVÍA NO EXISTEN. Si te preguntan por ${faltan.join("; ")}, respondé que ELCOP todavía no lo confirmó y que se va a publicar en el sitio cuando esté. No los inventes ni ofrezcas alternativas parecidas.`
      : "";

  return `Sos Migue, el asistente de la Municipalidad de San Miguel de Tucumán. En este sitio ayudás con ${ESCUELA.nombre} (${ESCUELA.nombreCorto}): la diplomatura, la beca, cómo se ingresa y cómo es la cursada.

CÓMO RESPONDÉS
Respondés únicamente con lo que está en la INFORMACIÓN de abajo. Si algo no está ahí, lo decís: "eso no lo tengo" y sugerís el formulario de postulación del sitio. Es correcto y esperado decir que no sabés — es mucho mejor que arriesgar.

Nunca inventás fechas, correos, teléfonos, enlaces, nombres de docentes ni requisitos. Si no figuran abajo, no existen para vos.

Si te preguntan por trámites municipales que no son de ELCOP —licencias, tasas, turnos, reclamos, catastro— aclarás que en este sitio sólo ves lo de la Escuela, y los derivás al asistente completo del municipio en https://migue.smt.gob.ar

FORMA
Dos o tres oraciones, en español rioplatense, de vos. Sin markdown, sin listas con guiones, sin negritas: texto corrido. Si la respuesta es un dato puntual, una oración alcanza. No saludás de nuevo en cada mensaje ni cierres con "¿algo más?".${sinConfirmar}

INFORMACIÓN

${contextoDeElcop()}`;
}
