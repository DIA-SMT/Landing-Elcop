import type { CollectionConfig } from "payload";

import { cualquiera, equipoElcop } from "../acceso";
import { esProvisorio, orden } from "../campos";

/**
 * La franja de indicadores del inicio: 1.091 postulantes, 80 seleccionados,
 * beca del 100%, 4 meses de cursada.
 *
 * El valor se guarda como número, no como texto ya formateado: el separador de
 * miles lo pone `formatearNumero` en el sitio. Guardar "1.091" rompería el
 * contador animado y la localización.
 */
export const Indicadores: CollectionConfig = {
  slug: "indicadores",
  labels: { singular: "Indicador", plural: "Indicadores del inicio" },
  admin: {
    useAsTitle: "etiqueta",
    group: "Inicio",
    defaultColumns: ["etiqueta", "valor", "orden"],
    description: "Los números grandes de la franja del inicio."
  },
  defaultSort: "orden",
  access: { read: cualquiera, create: equipoElcop, update: equipoElcop, delete: equipoElcop },
  fields: [
    {
      name: "valor",
      type: "number",
      required: true,
      admin: {
        description: "Sólo el número, sin puntos ni símbolos. Ej: 1091, no 1.091."
      }
    },
    {
      name: "sufijo",
      type: "text",
      required: false,
      admin: { description: "Lo que va pegado al número. Ej: %" }
    },
    { name: "etiqueta", type: "text", required: true, admin: { description: "Ej: Postulantes" } },
    {
      name: "detalle",
      type: "text",
      required: true,
      admin: { description: "La línea chica de abajo. Ej: En la primera convocatoria" }
    },
    orden(),
    esProvisorio()
  ]
};
