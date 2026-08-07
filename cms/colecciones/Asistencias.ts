import type { CollectionConfig } from "payload";

import { equipoElcop, propioOEquipo, soloAdmin } from "../acceso";

/**
 * Un registro por becario y por encuentro.
 *
 * El becario ve las suyas y nada más: la regla de acceso devuelve una consulta
 * en vez de un booleano, así que Payload la aplica también en los listados y
 * nadie ve en una lista la asistencia de otro.
 *
 * **No se crea desde el panel.** Entra por el endpoint del QR o la carga manual
 * de la coordinación, que valida la ventana horaria y el código rotativo. Si el
 * panel pudiera crearlas, se saltearía esa validación.
 *
 * `origen` deja el rastro de cómo se registró cada una. Cuando alguien reclame
 * una asistencia, la diferencia entre "la marcó el becario con el QR" y "la
 * cargó la coordinación a mano" es lo primero que se va a mirar.
 *
 * El índice único sobre (encuentro, becario) evita que un doble toque en el QR
 * deje dos registros del mismo encuentro y el porcentaje salga mal. El
 * prototipo ya lo tenía y estaba bien puesto.
 */
export const Asistencias: CollectionConfig = {
  slug: "asistencias",
  labels: { singular: "Asistencia", plural: "Asistencias" },
  admin: {
    group: "Cursada",
    defaultColumns: ["becario", "encuentro", "estado", "origen", "registradaEn"],
    description: "Se cargan desde el QR o a mano. No se crean desde acá."
  },
  defaultSort: "-registradaEn",
  indexes: [{ fields: ["encuentro", "becario"], unique: true }],
  access: {
    read: propioOEquipo("becario"),
    create: () => false,
    update: equipoElcop,
    delete: soloAdmin
  },
  fields: [
    {
      name: "encuentro",
      type: "relationship",
      relationTo: "encuentros",
      required: true,
      index: true
    },
    {
      name: "becario",
      type: "relationship",
      relationTo: "usuarios",
      required: true,
      index: true,
      filterOptions: { rol: { equals: "becario" } }
    },
    {
      name: "estado",
      type: "select",
      required: true,
      defaultValue: "presente",
      options: [
        { label: "Presente", value: "presente" },
        { label: "Ausente", value: "ausente" },
        { label: "Ausencia justificada", value: "justificada" }
      ],
      admin: { position: "sidebar" }
    },
    {
      name: "origen",
      type: "select",
      required: true,
      defaultValue: "qr",
      options: [
        { label: "Código QR", value: "qr" },
        { label: "Carga manual", value: "manual" }
      ],
      admin: { position: "sidebar", readOnly: true }
    },
    {
      name: "registradaEn",
      type: "date",
      required: true,
      admin: {
        readOnly: true,
        date: { pickerAppearance: "dayAndTime", displayFormat: "dd/MM/yyyy HH:mm" }
      }
    },
    {
      name: "registradaPor",
      type: "relationship",
      relationTo: "usuarios",
      required: false,
      admin: {
        readOnly: true,
        description: "Quién la cargó, cuando fue a mano."
      }
    },
    {
      name: "observacion",
      type: "textarea",
      required: false,
      admin: { description: "Por qué se corrigió o se justificó. Lo ve el equipo y el becario." }
    }
  ]
};
