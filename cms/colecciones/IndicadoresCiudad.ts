import type { CollectionConfig } from "payload";

import { cualquiera, equipoElcop } from "../acceso";
import { esProvisorio, orden, procedencia } from "../campos";

/**
 * Datos de San Miguel de Tucumán.
 *
 * Sale del documento de ELCOP, que pide que Publicaciones tenga "notas, fotos
 * y datos de la ciudad". Los carga la coordinación a mano.
 *
 * Dos reglas que no son opcionales en un sitio oficial:
 *
 * 1. **Fuente y fecha de corte son obligatorias.** Un número sin origen en un
 *    sitio del municipio no es un dato, es un pasivo. Por eso están en el
 *    esquema y no como sugerencia.
 * 2. **Lo estimado se dice.** `esProvisorio` marca el dato en la interfaz.
 *
 * A diferencia de los indicadores del inicio, acá el valor se guarda como
 * texto: hay datos que no son un número limpio ("605.767 habitantes", "1.240
 * ha", "17 °C promedio") y forzarlos a número obligaría a inventar un campo de
 * unidad para cada caso.
 */
export const IndicadoresCiudad: CollectionConfig = {
  slug: "indicadores-ciudad",
  labels: { singular: "Dato de la ciudad", plural: "Datos de la ciudad" },
  admin: {
    useAsTitle: "etiqueta",
    group: "Publicaciones",
    defaultColumns: ["etiqueta", "valor", "fuente", "fechaDeCorte"],
    description:
      "Indicadores de San Miguel de Tucumán que se publican junto a las notas. Cada uno necesita fuente y fecha."
  },
  defaultSort: "orden",
  access: { read: cualquiera, create: equipoElcop, update: equipoElcop, delete: equipoElcop },
  fields: [
    {
      name: "etiqueta",
      type: "text",
      required: true,
      admin: { description: "Qué mide. Ej: Población" }
    },
    {
      name: "valor",
      type: "text",
      required: true,
      admin: { description: "El dato tal como se muestra, con su unidad. Ej: 605.767 habitantes" }
    },
    {
      name: "detalle",
      type: "textarea",
      required: false,
      admin: { description: "Una línea de contexto, si hace falta para entenderlo." }
    },
    {
      name: "categoria",
      type: "select",
      required: true,
      defaultValue: "demografia",
      options: [
        { label: "Demografía", value: "demografia" },
        { label: "Economía", value: "economia" },
        { label: "Territorio y ambiente", value: "territorio" },
        { label: "Servicios y movilidad", value: "servicios" },
        { label: "Gestión municipal", value: "gestion" }
      ],
      admin: { position: "sidebar" }
    },
    ...procedencia(),
    {
      name: "enlaceFuente",
      type: "text",
      required: false,
      admin: {
        description: "Enlace a la publicación de origen, si está disponible en línea."
      }
    },
    orden(),
    esProvisorio({
      descripcion:
        "Tildalo si el dato es estimado o preliminar. El sitio lo muestra marcado como tal."
    })
  ]
};
