import type { GlobalConfig } from "payload";

import { cualquiera, equipoElcop } from "../acceso";

/**
 * Contacto, redes, co-branding y crédito de desarrollo.
 *
 * Email, teléfono y redes son opcionales a propósito. Hoy no los tenemos, y la
 * interfaz ya sabe qué hacer con un campo vacío: lo muestra como "A confirmar"
 * con un badge, en vez de dejar un hueco que se lea como que el sitio está
 * roto. Cuando ELCOP los pase, se cargan acá y el badge desaparece solo.
 */
export const Pie: GlobalConfig = {
  slug: "pie",
  label: "Pie de página",
  admin: { group: "Sistema" },
  access: { read: cualquiera, update: equipoElcop },
  fields: [
    {
      name: "direccion",
      type: "group",
      fields: [
        { name: "institucion", type: "text", required: true, defaultValue: "UNSTA" },
        { name: "calle", type: "text", required: true, defaultValue: "9 de Julio 165" },
        { name: "ciudad", type: "text", required: true, defaultValue: "San Miguel de Tucumán" },
        {
          name: "mapa",
          type: "text",
          required: false,
          admin: { description: "Enlace al mapa. Por búsqueda de dirección, sin datos personales en la URL." }
        }
      ]
    },
    {
      name: "email",
      type: "email",
      required: false,
      admin: { description: "Si está vacío, el pie muestra «A confirmar»." }
    },
    {
      name: "telefono",
      type: "text",
      required: false,
      admin: { description: "Si está vacío, el pie muestra «A confirmar»." }
    },
    {
      name: "redes",
      type: "array",
      label: "Redes sociales",
      admin: { description: "Las que no tengan enlace se muestran como pendientes." },
      fields: [
        { name: "nombre", type: "text", required: true },
        { name: "href", type: "text", required: false }
      ]
    },
    {
      name: "coBranding",
      type: "array",
      label: "Una iniciativa de",
      admin: { description: "Los logos institucionales del pie: Ciudad SMT y UNSTA." },
      fields: [
        { name: "nombre", type: "text", required: true },
        { name: "logo", type: "upload", relationTo: "media", required: true },
        { name: "href", type: "text", required: false }
      ]
    },
    {
      name: "desarrollo",
      type: "group",
      label: "Crédito de desarrollo",
      fields: [
        { name: "etiqueta", type: "text", required: true, defaultValue: "Creado por" },
        { name: "nombre", type: "text", required: true },
        { name: "logo", type: "upload", relationTo: "media", required: false },
        { name: "href", type: "text", required: false }
      ]
    },
    {
      name: "avisoEnConstruccion",
      type: "text",
      required: false,
      admin: {
        description:
          "La línea que avisa que hay contenidos provisorios. Vaciala cuando ya no queden."
      }
    }
  ]
};
