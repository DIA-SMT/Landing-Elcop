import type { GlobalConfig } from "payload";

import { cualquiera, equipoElcop } from "../acceso";

/**
 * El hero. Es global y no colección porque hay uno solo y siempre existe: se
 * edita, no se agrega ni se borra.
 *
 * El título lleva una palabra resaltada en azul. En vez de guardar HTML, se
 * guarda la palabra aparte y el sitio la resalta donde aparezca: así quien
 * carga contenido no necesita saber marcado, y no puede romper la maqueta con
 * una etiqueta mal cerrada.
 */
export const Inicio: GlobalConfig = {
  slug: "inicio",
  label: "Inicio (hero)",
  admin: { group: "Inicio" },
  access: { read: cualquiera, update: equipoElcop },
  fields: [
    {
      name: "eyebrow",
      type: "text",
      required: true,
      admin: { description: "La píldora chica de arriba. Ej: Municipalidad de SMT + UNSTA" }
    },
    { name: "titulo", type: "text", required: true },
    {
      name: "palabraResaltada",
      type: "text",
      required: false,
      admin: {
        description:
          "Una palabra del título que se pinta de azul. Tiene que estar escrita igual que en el título."
      }
    },
    { name: "bajada", type: "textarea", required: true },
    {
      name: "videos",
      type: "array",
      label: "Videos de fondo",
      maxRows: 5,
      admin: {
        description:
          "Se cruzan entre sí debajo de un velo blanco. No se descargan en celulares ni con movimiento reducido. Ojo: el velo está calculado al 82% para que el texto conserve contraste; si se sube la opacidad hay que revisar los videos con texto institucional."
      },
      fields: [
        { name: "video", type: "upload", relationTo: "media", required: true },
        { name: "portada", type: "upload", relationTo: "media", required: true },
        { name: "descripcion", type: "text", required: true }
      ]
    }
  ]
};
