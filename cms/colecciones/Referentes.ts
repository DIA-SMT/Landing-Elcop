import type { CollectionConfig } from "payload";

import { cualquiera, equipoElcop } from "../acceso";
import { esProvisorio, foto, orden } from "../campos";

/**
 * Los disertantes de las masterclass. Es la colección que más va a crecer:
 * suma una entrada por cada encuentro.
 */
export const Referentes: CollectionConfig = {
  slug: "referentes",
  labels: { singular: "Referente", plural: "Referentes de masterclass" },
  admin: {
    useAsTitle: "nombre",
    group: "Formación",
    defaultColumns: ["nombre", "credencial", "fecha"]
  },
  defaultSort: "orden",
  access: { read: cualquiera, create: equipoElcop, update: equipoElcop, delete: equipoElcop },
  fields: [
    { name: "nombre", type: "text", required: true },
    {
      name: "credencial",
      type: "text",
      required: true,
      admin: { description: "Ej: Investigador CONICET · Dr. FLACSO-México" }
    },
    {
      name: "tema",
      type: "text",
      required: true,
      admin: { description: "De qué habló. Ej: Opinión pública y dinámica del electorado" }
    },
    foto(),
    {
      name: "fecha",
      type: "date",
      required: false,
      admin: {
        position: "sidebar",
        description: "Cuándo dictó la masterclass. Hoy no se muestra; sirve para ordenar.",
        date: { pickerAppearance: "dayOnly", displayFormat: "dd/MM/yyyy" }
      }
    },
    orden(),
    esProvisorio()
  ]
};
