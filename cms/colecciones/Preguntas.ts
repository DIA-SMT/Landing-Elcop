import type { CollectionConfig } from "payload";

import { cualquiera, equipoElcop } from "../acceso";
import { esProvisorio, orden } from "../campos";

/** Las preguntas frecuentes del acordeón. Crece con lo que más consultan. */
export const Preguntas: CollectionConfig = {
  slug: "preguntas",
  labels: { singular: "Pregunta", plural: "Preguntas frecuentes" },
  admin: { useAsTitle: "pregunta", group: "Inscripciones", defaultColumns: ["pregunta", "orden"] },
  defaultSort: "orden",
  access: { read: cualquiera, create: equipoElcop, update: equipoElcop, delete: equipoElcop },
  fields: [
    { name: "pregunta", type: "text", required: true },
    {
      name: "respuesta",
      // Enriquecido porque las respuestas necesitan al menos enlaces y negritas.
      type: "richText",
      required: true
    },
    orden(),
    esProvisorio()
  ]
};
