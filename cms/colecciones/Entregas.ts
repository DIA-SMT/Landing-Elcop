import type { CollectionConfig } from "payload";

import { equipoElcopCampo, propioOEquipo, soloAdmin } from "../acceso";

/**
 * El Proyecto de Política Pública Innovadora. Uno por becario.
 *
 * **No es un archivo, es un formulario estructurado.** Los campos salen del
 * prototipo, donde tienen pinta de venir de la rúbrica real: problema,
 * diagnóstico, presupuesto y viabilidad. La ventaja no es de formulario: si
 * esto es una competencia, tener ochenta proyectos en campos comparables
 * permite ordenarlos y evaluarlos. Con ochenta PDF sueltos, cada uno es una
 * caja negra.
 *
 * El archivo adjunto queda como opcional, para anexos: planos, presupuesto
 * detallado, la presentación de la defensa.
 *
 * **`estado` es del becario hasta que entrega.** Mientras esté en borrador
 * puede editar todo; una vez presentado, el corte lo pone el endpoint, no el
 * panel. Y la fecha límite se valida en el servidor: una fecha límite que sólo
 * se controla en el navegador se saltea con la consola abierta.
 *
 * TODO: confirmar con ELCOP si hay jurado y puntaje. Si la competencia tiene
 * rúbrica con varios evaluadores, `evaluacion` deja de ser un grupo de campos y
 * pasa a ser una colección aparte.
 */
export const Entregas: CollectionConfig = {
  slug: "entregas",
  labels: { singular: "Proyecto final", plural: "Proyectos finales" },
  admin: {
    useAsTitle: "titulo",
    group: "Portal",
    defaultColumns: ["titulo", "becario", "estado", "presentadoEn"]
  },
  defaultSort: "-presentadoEn",
  access: {
    read: propioOEquipo("becario"),
    // Se crea desde el portal, no desde el panel.
    create: () => false,
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
      unique: true,
      filterOptions: { rol: { equals: "becario" } },
      admin: { readOnly: true, description: "Una entrega por persona: el campo es único." }
    },
    {
      name: "titulo",
      type: "text",
      required: true,
      admin: { description: "Nombre del proyecto." }
    },
    {
      name: "problema",
      type: "textarea",
      required: true,
      label: "Problema que aborda",
      admin: { description: "Qué situación concreta de la ciudad busca resolver." }
    },
    {
      name: "diagnostico",
      type: "textarea",
      required: true,
      label: "Diagnóstico",
      admin: { description: "Evidencia y datos que sostienen el planteo." }
    },
    {
      name: "propuesta",
      type: "textarea",
      required: true,
      label: "Propuesta",
      admin: { description: "Qué se propone hacer, concretamente." }
    },
    {
      name: "presupuesto",
      type: "textarea",
      required: false,
      label: "Presupuesto estimado",
      admin: { description: "Qué recursos necesita y de dónde saldrían." }
    },
    {
      name: "viabilidad",
      type: "textarea",
      required: false,
      label: "Notas de viabilidad",
      admin: { description: "Qué haría falta para que se pueda implementar de verdad." }
    },
    {
      name: "anexo",
      type: "upload",
      relationTo: "media",
      required: false,
      admin: {
        description: "Opcional: planos, presupuesto detallado o la presentación de la defensa."
      }
    },
    {
      name: "estado",
      type: "select",
      required: true,
      defaultValue: "borrador",
      options: [
        { label: "Borrador", value: "borrador" },
        { label: "Presentado", value: "presentado" },
        { label: "Con observaciones", value: "observado" },
        { label: "Aprobado", value: "aprobado" }
      ],
      admin: {
        position: "sidebar",
        description: "En borrador el becario puede seguir editando. Presentado cierra la edición."
      }
    },
    {
      name: "presentadoEn",
      type: "date",
      required: false,
      admin: {
        position: "sidebar",
        readOnly: true,
        description: "Vacío mientras esté en borrador.",
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
        { name: "evaluadaPor", type: "relationship", relationTo: "usuarios", required: false }
      ],
      access: {
        // La devolución la escribe el comité; el becario la lee pero no la toca.
        update: equipoElcopCampo
      }
    }
  ]
};
