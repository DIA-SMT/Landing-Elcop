import type { CollectionConfig } from "payload";

import { equipoElcop, portal } from "../acceso";

/**
 * Las sesiones virtuales de mentoría.
 *
 * `cierreDeConsultas` es lo que hace funcionar el "antes de la sesión" que pide
 * el documento: pasada esa hora, el becario ya no puede sumar preguntas y quien
 * mentorea tiene la lista cerrada para preparar el encuentro. Sin ese corte, la
 * última consulta llega mientras la sesión ya empezó.
 */
export const SesionesMentoria: CollectionConfig = {
  slug: "sesiones-mentoria",
  labels: { singular: "Sesión de mentoría", plural: "Sesiones de mentoría" },
  admin: {
    useAsTitle: "titulo",
    group: "Cursada",
    defaultColumns: ["titulo", "comienza", "mentor", "estado"]
  },
  defaultSort: "-comienza",
  access: { read: portal, create: equipoElcop, update: equipoElcop, delete: equipoElcop },
  fields: [
    { name: "titulo", type: "text", required: true },
    {
      name: "mentor",
      type: "relationship",
      relationTo: "usuarios",
      required: false,
      admin: { position: "sidebar", description: "Quién responde en esta sesión." }
    },
    {
      name: "comienza",
      type: "date",
      required: true,
      admin: { date: { pickerAppearance: "dayAndTime", displayFormat: "dd/MM/yyyy HH:mm" } }
    },
    {
      name: "cierreDeConsultas",
      type: "date",
      required: true,
      admin: {
        description: "Después de esta hora no se aceptan más preguntas para esta sesión.",
        date: { pickerAppearance: "dayAndTime", displayFormat: "dd/MM/yyyy HH:mm" }
      }
    },
    { name: "enlace", type: "text", required: false, admin: { description: "Videollamada." } },
    {
      name: "estado",
      type: "select",
      required: true,
      defaultValue: "programada",
      options: [
        { label: "Programada", value: "programada" },
        { label: "Realizada", value: "realizada" },
        { label: "Cancelada", value: "cancelada" }
      ],
      admin: { position: "sidebar" }
    }
  ]
};
