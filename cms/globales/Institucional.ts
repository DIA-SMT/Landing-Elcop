import type { GlobalConfig } from "payload";

import { cualquiera, equipoElcop } from "../acceso";

/**
 * La sección "¿Quiénes somos?", la carpeta institucional y los encabezados de
 * los tres grupos del equipo.
 *
 * Los títulos de los grupos viven acá y no en cada integrante: son texto fijo,
 * y repetirlos por persona sería pedir que nueve registros digan lo mismo.
 */
export const Institucional: GlobalConfig = {
  slug: "institucional",
  label: "Institucional",
  admin: { group: "Institucional" },
  access: { read: cualquiera, update: equipoElcop },
  fields: [
    { name: "kicker", type: "text", required: true, defaultValue: "Institucional" },
    { name: "titulo", type: "text", required: true, defaultValue: "¿Quiénes somos?" },
    {
      name: "parrafos",
      type: "array",
      label: "Párrafos",
      minRows: 1,
      fields: [{ name: "texto", type: "textarea", required: true }]
    },
    {
      name: "foto",
      type: "upload",
      relationTo: "media",
      required: false,
      admin: { description: "La foto que acompaña al texto. Hoy es la fachada de la UNSTA." }
    },
    { name: "epigrafe", type: "text", required: false, admin: { description: "Pie de la foto." } },
    {
      name: "carpeta",
      type: "group",
      label: "Carpeta institucional",
      admin: {
        description:
          "Si no hay archivo cargado, el sitio deshabilita el botón y avisa que el PDF está pendiente, en vez de llevar a un 404."
      },
      fields: [
        {
          name: "etiqueta",
          type: "text",
          required: true,
          defaultValue: "Descargá nuestra carpeta institucional"
        },
        { name: "archivo", type: "upload", relationTo: "media", required: false }
      ]
    },
    {
      name: "grupos",
      type: "array",
      label: "Grupos del equipo",
      admin: {
        description:
          "El título y la bajada de cada grupo. Las personas se cargan en Equipo, y el valor debe coincidir con el grupo elegido ahí."
      },
      fields: [
        {
          name: "valor",
          type: "select",
          required: true,
          options: [
            { label: "Dirección", value: "direccion" },
            { label: "Coordinación Académica", value: "coordinacion-academica" },
            { label: "Coordinación Administrativa", value: "coordinacion-administrativa" }
          ]
        },
        { name: "titulo", type: "text", required: true },
        { name: "descripcion", type: "text", required: true }
      ]
    }
  ]
};
