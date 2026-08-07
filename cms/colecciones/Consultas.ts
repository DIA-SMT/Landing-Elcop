import type { CollectionConfig } from "payload";

import { equipoElcop, propioOEquipo, soloAdmin } from "../acceso";

/**
 * Las consultas de los becarios.
 *
 * Cubre los dos modos que pediste: `sesion` con valor es una duda enviada antes
 * de una sesión de mentoría, y `sesion` vacía es una consulta suelta del canal
 * abierto. Una sola colección alcanza; separarlas en dos obligaría a mirar en
 * dos lugares para responder lo mismo.
 *
 * El becario ve las suyas y nada más. El "3 consultas pendientes" del panel
 * sale de contar acá por estado: no hace falta guardar ese número en ningún
 * lado.
 */
export const Consultas: CollectionConfig = {
  slug: "consultas",
  labels: { singular: "Consulta", plural: "Consultas de mentoría" },
  admin: {
    useAsTitle: "asunto",
    group: "Cursada",
    defaultColumns: ["asunto", "becario", "sesion", "estado", "createdAt"]
  },
  defaultSort: "-createdAt",
  access: {
    read: propioOEquipo("becario"),
    // La crea el becario desde el portal, no desde el panel.
    create: () => false,
    update: equipoElcop,
    delete: soloAdmin
  },
  fields: [
    {
      name: "becario",
      type: "relationship",
      relationTo: "usuarios",
      required: true,
      index: true,
      admin: { readOnly: true }
    },
    {
      name: "sesion",
      type: "relationship",
      relationTo: "sesiones-mentoria",
      required: false,
      admin: {
        description: "Si está vacío, es una consulta del canal abierto y no de una sesión."
      }
    },
    { name: "asunto", type: "text", required: true, admin: { readOnly: true } },
    { name: "consulta", type: "textarea", required: true, admin: { readOnly: true } },
    {
      name: "estado",
      type: "select",
      required: true,
      defaultValue: "pendiente",
      options: [
        { label: "Pendiente", value: "pendiente" },
        { label: "Respondida", value: "respondida" },
        { label: "Cerrada", value: "cerrada" }
      ],
      admin: { position: "sidebar" }
    },
    {
      name: "respuesta",
      type: "textarea",
      required: false,
      admin: { description: "La ve el becario en su portal." }
    },
    {
      name: "respondidaPor",
      type: "relationship",
      relationTo: "usuarios",
      required: false,
      admin: { position: "sidebar", readOnly: true }
    },
    {
      name: "respondidaEn",
      type: "date",
      required: false,
      admin: {
        position: "sidebar",
        readOnly: true,
        date: { pickerAppearance: "dayAndTime", displayFormat: "dd/MM/yyyy HH:mm" }
      }
    }
  ]
};
