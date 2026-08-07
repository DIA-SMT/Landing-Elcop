import type { CollectionConfig } from "payload";

import { cualquiera, equipoElcop } from "../acceso";
import { foto, orden } from "../campos";

/**
 * El equipo de la Escuela.
 *
 * Va como una sola colección de personas con el grupo como campo, y no como
 * grupos anidados con integrantes adentro: son nueve personas en tres grupos
 * estables, y dos colecciones anidadas serían más ceremonia que beneficio.
 *
 * Los títulos y descripciones de los tres grupos viven en el global
 * Institucional, porque son texto fijo y no datos que se repitan por persona.
 */
export const Integrantes: CollectionConfig = {
  slug: "integrantes",
  labels: { singular: "Integrante", plural: "Equipo" },
  admin: {
    useAsTitle: "nombre",
    group: "Institucional",
    defaultColumns: ["nombre", "tratamiento", "grupo", "orden"]
  },
  defaultSort: "orden",
  access: { read: cualquiera, create: equipoElcop, update: equipoElcop, delete: equipoElcop },
  fields: [
    {
      name: "tratamiento",
      type: "text",
      required: true,
      admin: { description: "Ej: Dra., Mg. Ing., Sr." }
    },
    { name: "nombre", type: "text", required: true },
    {
      name: "grupo",
      type: "select",
      required: true,
      options: [
        { label: "Dirección", value: "direccion" },
        { label: "Coordinación Académica", value: "coordinacion-academica" },
        { label: "Coordinación Administrativa", value: "coordinacion-administrativa" }
      ],
      admin: { position: "sidebar" }
    },
    foto(),
    orden()
  ]
};
