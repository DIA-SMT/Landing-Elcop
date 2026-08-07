import type { GlobalConfig } from "payload";

import { cualquiera, equipoElcop } from "../acceso";

/**
 * Beca, proceso de admisión, cursada y evaluación final.
 *
 * El titular de la beca está partido en dos porque la oración oficial es larga
 * y se corta en la coma: la primera mitad entra como bajada y la segunda como
 * titular, de modo que el texto queda textual y el titular conserva el peso.
 *
 * Nota sobre el formulario de postulación: sus campos **no** se editan desde
 * el panel. Cada uno está atado a una regla de validación en el código —el DNI
 * contra 7 u 8 dígitos, la fecha de nacimiento calcula edad mínima, la
 * motivación tiene piso de caracteres—, así que cambiar un identificador desde
 * una pantalla dejaría la validación sin efecto en silencio. Agregar o quitar
 * un campo es tarea de desarrollo. Lo que sí se edita acá son los textos que
 * lo rodean.
 */
export const Inscripciones: GlobalConfig = {
  slug: "inscripciones",
  label: "Inscripciones",
  admin: { group: "Inscripciones" },
  access: { read: cualquiera, update: equipoElcop },
  fields: [
    { name: "kicker", type: "text", required: true, defaultValue: "Inscripciones" },
    { name: "titulo", type: "text", required: true },
    {
      name: "becaIntro",
      type: "text",
      required: true,
      admin: { description: "Primera mitad de la frase oficial, hasta la coma." }
    },
    {
      name: "beca",
      type: "textarea",
      required: true,
      admin: { description: "Segunda mitad: es la que se ve grande." }
    },
    {
      name: "etapasIntro",
      type: "textarea",
      required: true,
      admin: { description: "Encadena los cupos limitados con las dos etapas del proceso." }
    },
    {
      name: "etapas",
      type: "array",
      label: "Etapas del proceso",
      minRows: 1,
      fields: [
        { name: "numero", type: "number", required: true },
        { name: "titulo", type: "text", required: true },
        { name: "descripcion", type: "textarea", required: true }
      ]
    },
    {
      name: "cursada",
      type: "group",
      fields: [
        { name: "duracion", type: "text", required: true },
        { name: "modalidad", type: "text", required: true },
        { name: "modalidadDetalle", type: "textarea", required: false },
        {
          name: "asistencia",
          type: "text",
          required: true,
          admin: {
            description:
              "El requisito de regularidad. Va destacado en la interfaz, no en letra chica."
          }
        },
        { name: "asistenciaDetalle", type: "textarea", required: false }
      ]
    },
    {
      name: "evaluacionFinal",
      type: "group",
      fields: [
        { name: "titulo", type: "text", required: true },
        { name: "descripcion", type: "textarea", required: true }
      ]
    },
    { name: "cupos", type: "textarea", required: true },
    {
      name: "proximaCohorte",
      type: "text",
      required: false,
      admin: {
        description:
          "Fechas de la próxima convocatoria. Mientras esté vacío, la interfaz dice que todavía no hay fecha confirmada."
      }
    },
    {
      name: "formulario",
      type: "group",
      label: "Textos del formulario",
      admin: { description: "Los campos del formulario se definen en el código, no acá." },
      fields: [
        { name: "titulo", type: "text", required: true },
        { name: "bajada", type: "textarea", required: true },
        { name: "confirmacionTitulo", type: "text", required: true },
        { name: "confirmacionTexto", type: "textarea", required: true }
      ]
    }
  ]
};
