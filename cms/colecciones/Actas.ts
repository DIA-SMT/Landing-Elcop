import type { CollectionConfig } from "payload";

import { equipoElcop, propioOEquipo, soloAdmin } from "../acceso";

/**
 * Contrato de Beca y Acta Compromiso: la sección "Mi Beca" del portal.
 *
 * Un documento por becario, generado con sus datos, y con la aceptación
 * registrada.
 *
 * **Advertencia que no es técnica.** Aceptar con un clic es firma electrónica,
 * no firma digital: la Ley 25.506 le da a cada una un valor probatorio
 * distinto, y la digital necesita certificado. Los campos de abajo guardan la
 * evidencia mínima habitual —cuándo, desde qué dirección IP y con qué
 * navegador— pero **si ELCOP necesita que el acta sea oponible, quién define
 * qué alcanza es Legales, no desarrollo.** Hasta que eso esté definido, esta
 * colección puede quedar corta o sobrar.
 *
 * La IP y el navegador son datos personales: se guardan sólo porque son la
 * evidencia de la aceptación, y no deberían usarse para ninguna otra cosa.
 */
export const Actas: CollectionConfig = {
  slug: "actas",
  labels: { singular: "Acta", plural: "Actas y contratos" },
  admin: {
    useAsTitle: "titulo",
    group: "Portal",
    defaultColumns: ["titulo", "becario", "tipo", "aceptadaEn"],
    description: "Se generan por becario. La aceptación la hace la persona desde el portal."
  },
  defaultSort: "-createdAt",
  access: {
    read: propioOEquipo("becario"),
    create: equipoElcop,
    // El becario sólo puede aceptar la suya; el equipo puede corregir el resto.
    update: propioOEquipo("becario"),
    delete: soloAdmin
  },
  fields: [
    {
      name: "becario",
      type: "relationship",
      relationTo: "usuarios",
      required: true,
      index: true,
      filterOptions: { rol: { equals: "becario" } },
      admin: { readOnly: true }
    },
    {
      name: "tipo",
      type: "select",
      required: true,
      options: [
        { label: "Contrato de Beca", value: "contrato-beca" },
        { label: "Acta Compromiso", value: "acta-compromiso" }
      ],
      admin: { position: "sidebar" }
    },
    { name: "titulo", type: "text", required: true },
    {
      name: "documento",
      type: "upload",
      relationTo: "media",
      required: false,
      admin: {
        description: "El PDF personalizado. Lo genera el sistema con los datos de la persona."
      }
    },
    {
      name: "aceptadaEn",
      type: "date",
      required: false,
      admin: {
        position: "sidebar",
        readOnly: true,
        description: "Vacío significa pendiente de aceptación.",
        date: { pickerAppearance: "dayAndTime", displayFormat: "dd/MM/yyyy HH:mm" }
      }
    },
    {
      name: "evidencia",
      type: "group",
      label: "Evidencia de la aceptación",
      admin: {
        readOnly: true,
        description:
          "Datos personales que se guardan sólo como prueba de la aceptación. No usar para otra cosa."
      },
      fields: [
        { name: "ip", type: "text", required: false },
        { name: "navegador", type: "text", required: false },
        {
          name: "textoAceptado",
          type: "textarea",
          required: false,
          admin: {
            description:
              "Copia del texto vigente al momento de aceptar. Si el acta se edita después, esto prueba qué firmó la persona."
          }
        }
      ]
    }
  ]
};
