import type { CollectionConfig } from "payload";

import { docenteOEquipo, portal, subidoPorMiOEquipo } from "../acceso";

/**
 * El repositorio de clases: presentaciones, lecturas y bibliografía.
 *
 * Cuelga del módulo y, opcionalmente, de un encuentro. Así se cubren los dos
 * casos reales: el material de una clase puntual, y la bibliografía del módulo
 * que no pertenece a ningún encuentro en particular. El documento pide
 * "pestañas por módulo", que es exactamente esto.
 *
 * **`visibleDesde` no es un adorno.** Casi siempre el material se sube antes de
 * la clase y no debería verse hasta después. Sin este campo, la alternativa es
 * que alguien se acuerde de subirlo en el momento justo.
 */
export const Materiales: CollectionConfig = {
  slug: "materiales",
  labels: { singular: "Material", plural: "Materiales de clase" },
  admin: {
    useAsTitle: "titulo",
    group: "Cursada",
    defaultColumns: ["titulo", "tipo", "modulo", "encuentro", "visibleDesde"]
  },
  defaultSort: "-visibleDesde",
  access: {
    // Lo lee todo el portal; lo sube el equipo y los docentes, y cada docente
    // sólo toca lo suyo.
    read: portal,
    create: docenteOEquipo,
    update: subidoPorMiOEquipo(),
    delete: subidoPorMiOEquipo()
  },
  upload: {
    mimeTypes: [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-powerpoint",
      "application/msword",
      "text/plain",
      "application/zip"
    ]
  },
  fields: [
    { name: "titulo", type: "text", required: true },
    {
      name: "tipo",
      type: "select",
      required: true,
      defaultValue: "presentacion",
      options: [
        { label: "Presentación", value: "presentacion" },
        { label: "Lectura", value: "lectura" },
        { label: "Bibliografía", value: "bibliografia" },
        { label: "Otro", value: "otro" }
      ],
      admin: { position: "sidebar" }
    },
    {
      name: "modulo",
      type: "relationship",
      relationTo: "modulos",
      required: true,
      admin: { position: "sidebar", description: "El módulo bajo el que se agrupa." }
    },
    {
      name: "encuentro",
      type: "relationship",
      relationTo: "encuentros",
      required: false,
      admin: {
        description: "Opcional. Dejalo vacío si es bibliografía del módulo y no de una clase."
      }
    },
    {
      name: "descripcion",
      type: "textarea",
      required: false,
      admin: { description: "Qué es y para qué sirve. Una línea alcanza." }
    },
    {
      name: "visibleDesde",
      type: "date",
      required: false,
      admin: {
        position: "sidebar",
        description: "Antes de esta fecha, los becarios no lo ven. Vacío significa visible ya.",
        date: { pickerAppearance: "dayAndTime", displayFormat: "dd/MM/yyyy HH:mm" }
      }
    },
    {
      name: "subidoPor",
      type: "relationship",
      relationTo: "usuarios",
      required: true,
      admin: {
        position: "sidebar",
        readOnly: true,
        description: "Se completa solo. Define qué puede editar cada docente."
      }
    }
  ]
};
