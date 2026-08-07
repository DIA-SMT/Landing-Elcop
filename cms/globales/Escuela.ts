import type { GlobalConfig } from "payload";

import { cualquiera, equipoElcop } from "../acceso";

/**
 * Identidad de la Escuela y encabezado de la sección Formación.
 *
 * Es lo que menos cambia del sitio, pero vive acá igual: dejar el nombre de la
 * institución en el código obliga a un despliegue para corregir una tilde.
 */
export const Escuela: GlobalConfig = {
  slug: "escuela",
  label: "Escuela y diplomatura",
  admin: { group: "Sistema" },
  access: { read: cualquiera, update: equipoElcop },
  fields: [
    { name: "nombreCorto", type: "text", required: true, defaultValue: "ELCOP" },
    { name: "nombre", type: "text", required: true },
    {
      name: "socios",
      type: "text",
      required: true,
      admin: { description: "Ej: Municipalidad de San Miguel de Tucumán · UNSTA" }
    },
    {
      name: "cohorte",
      type: "text",
      required: true,
      admin: { description: "La cohorte vigente. Ej: Cohorte 2026" }
    },
    {
      name: "diplomatura",
      type: "group",
      label: "Sección Formación",
      fields: [
        { name: "kicker", type: "text", required: true, defaultValue: "Formación" },
        { name: "titulo", type: "text", required: true },
        { name: "bajada", type: "textarea", required: true },
        { name: "duracion", type: "text", required: true },
        { name: "modalidad", type: "text", required: true },
        {
          name: "avisoProvisorio",
          type: "checkbox",
          label: "Mostrar aviso de programa provisorio",
          defaultValue: true,
          admin: {
            description:
              "Mientras esté tildado, la sección avisa que las descripciones de los ejes son preliminares."
          }
        }
      ]
    }
  ]
};
