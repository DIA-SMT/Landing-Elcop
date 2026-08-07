import type { CollectionConfig } from "payload";

import { cualquiera, equipoElcop } from "../acceso";
import { esProvisorio, orden } from "../campos";

/**
 * Los cuatro ejes de la diplomatura, que en el documento de ELCOP también
 * aparecen como "módulos".
 *
 * Hoy los cuatro tienen descripción y temario provisorios: los títulos son
 * oficiales, los textos los escribimos nosotros para sostener la maqueta. Por
 * eso arrancan con `esProvisorio` en `true`.
 */
export const Ejes: CollectionConfig = {
  slug: "ejes",
  labels: { singular: "Eje", plural: "Ejes de la diplomatura" },
  admin: {
    useAsTitle: "titulo",
    group: "Formación",
    defaultColumns: ["numero", "titulo", "esProvisorio"]
  },
  defaultSort: "orden",
  access: { read: cualquiera, create: equipoElcop, update: equipoElcop, delete: equipoElcop },
  fields: [
    {
      name: "numero",
      type: "number",
      required: true,
      admin: {
        position: "sidebar",
        description: "El sitio lo muestra con cero adelante: 1 se ve como 01."
      }
    },
    { name: "titulo", type: "text", required: true, admin: { description: "Ej: El Sujeto Político" } },
    {
      name: "descripcion",
      type: "textarea",
      required: true,
      admin: { description: "El párrafo que acompaña al número grande." }
    },
    {
      name: "temas",
      type: "array",
      labels: { singular: "Tema", plural: "Temas" },
      minRows: 1,
      admin: { description: "Los chips que se ven debajo del párrafo." },
      fields: [{ name: "tema", type: "text", required: true }]
    },
    orden(),
    // Los cuatro arrancan marcados: los títulos son oficiales, los textos no.
    esProvisorio({ porDefecto: true })
  ]
};
