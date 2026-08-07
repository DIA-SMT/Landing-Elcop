import type { CollectionConfig } from "payload";

import { equipoElcopCampo, propioOEquipo, soloAdmin } from "../acceso";

/**
 * El Proyecto de Política Pública Innovadora. Es individual: una entrega por
 * becario.
 *
 * **La fecha límite se valida en el servidor**, en el endpoint que recibe el
 * archivo. Una fecha límite que sólo se controla en el navegador no es una
 * fecha límite: se saltea con la consola abierta.
 *
 * El becario puede reemplazar su archivo mientras la entrega esté abierta, y
 * por eso `update` lo alcanza; el corte lo pone el endpoint, no el panel.
 *
 * TODO: confirmar con ELCOP si hay jurado y puntaje. El grupo `evaluacion` es
 * un placeholder mínimo: si la competencia tiene rúbrica o varios evaluadores,
 * esto pasa a ser una colección aparte y no un puñado de campos.
 */
export const Entregas: CollectionConfig = {
  slug: "entregas",
  labels: { singular: "Entrega", plural: "Proyectos finales" },
  admin: {
    useAsTitle: "titulo",
    group: "Portal",
    defaultColumns: ["titulo", "becario", "estado", "entregadaEn"]
  },
  defaultSort: "-entregadaEn",
  access: {
    read: propioOEquipo("becario"),
    create: () => false,
    update: propioOEquipo("becario"),
    delete: soloAdmin
  },
  upload: {
    mimeTypes: [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ]
  },
  fields: [
    {
      name: "becario",
      type: "relationship",
      relationTo: "usuarios",
      required: true,
      index: true,
      unique: true,
      filterOptions: { rol: { equals: "becario" } },
      admin: {
        readOnly: true,
        description: "Una entrega por persona: el campo es único."
      }
    },
    { name: "titulo", type: "text", required: true, admin: { description: "Nombre del proyecto." } },
    {
      name: "resumen",
      type: "textarea",
      required: true,
      admin: { description: "De qué se trata, en pocas líneas." }
    },
    {
      name: "estado",
      type: "select",
      required: true,
      defaultValue: "entregada",
      options: [
        { label: "Entregada", value: "entregada" },
        { label: "Con observaciones", value: "observada" },
        { label: "Aprobada", value: "aprobada" }
      ],
      admin: { position: "sidebar" }
    },
    {
      name: "entregadaEn",
      type: "date",
      required: true,
      admin: {
        position: "sidebar",
        readOnly: true,
        date: { pickerAppearance: "dayAndTime", displayFormat: "dd/MM/yyyy HH:mm" }
      }
    },
    {
      name: "evaluacion",
      type: "group",
      label: "Evaluación",
      admin: {
        description: "Provisorio: falta confirmar si la competencia tiene jurado y puntaje."
      },
      fields: [
        {
          name: "devolucion",
          type: "textarea",
          required: false,
          admin: { description: "La lee el becario en su portal." }
        },
        {
          name: "evaluadaPor",
          type: "relationship",
          relationTo: "usuarios",
          required: false
        }
      ],
      access: {
        // La devolución la escribe el comité; el becario la lee pero no la toca.
        update: equipoElcopCampo
      }
    }
  ]
};
