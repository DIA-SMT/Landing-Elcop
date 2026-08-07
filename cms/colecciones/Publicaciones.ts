import type { CollectionConfig } from "payload";

import { cualquiera, equipoElcop } from "../acceso";

/**
 * Las notas de la Escuela. Es la colección que más se va a usar, así que su
 * formulario de carga merece ser el más cuidado del panel.
 *
 * Es la única con borrador y publicado: alguien empieza a escribir una nota y
 * no la termina en una sentada. El resto del contenido se edita sobre lo
 * publicado, y agregarle borradores a todo duplicaría cada registro sin que
 * nadie lo pida.
 *
 * TODO: definir con ELCOP si las publicaciones llevan página propia. El campo
 * `cuerpo` y la ruta /publicaciones/[slug] dependen de esa decisión; hoy el
 * listado no lleva a ningún lado.
 */
export const Publicaciones: CollectionConfig = {
  slug: "publicaciones",
  labels: { singular: "Publicación", plural: "Publicaciones" },
  admin: {
    useAsTitle: "titulo",
    group: "Publicaciones",
    defaultColumns: ["titulo", "categoria", "fecha", "_status"]
  },
  defaultSort: "-fecha",
  versions: { drafts: true },
  access: {
    // Los borradores no salen al sitio público: `read` deja pasar sólo lo
    // publicado a quien no tiene sesión.
    read: ({ req }) => (req.user ? true : { _status: { equals: "published" } }),
    create: equipoElcop,
    update: equipoElcop,
    delete: equipoElcop
  },
  fields: [
    { name: "titulo", type: "text", required: true },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      index: true,
      admin: {
        position: "sidebar",
        description: "Se arma con el título. Cambiarlo rompe los enlaces que ya circulan."
      }
    },
    {
      name: "bajada",
      type: "textarea",
      required: true,
      maxLength: 280,
      admin: { description: "El resumen que se ve en la tarjeta del listado." }
    },
    {
      name: "cuerpo",
      type: "richText",
      required: false,
      admin: { description: "El texto completo de la nota, si lleva página propia." }
    },
    {
      name: "fecha",
      type: "date",
      required: true,
      admin: {
        position: "sidebar",
        date: { pickerAppearance: "dayOnly", displayFormat: "dd/MM/yyyy" }
      }
    },
    {
      name: "categoria",
      type: "select",
      required: true,
      defaultValue: "masterclass",
      options: [
        { label: "Masterclass", value: "masterclass" },
        { label: "Novedades", value: "novedades" },
        { label: "Institucional", value: "institucional" }
      ],
      admin: { position: "sidebar" }
    },
    {
      name: "imagen",
      type: "upload",
      relationTo: "media",
      required: true,
      admin: { description: "Portada de la nota. El texto alternativo se carga en el archivo." }
    },
    {
      name: "esEjemplo",
      type: "checkbox",
      label: "Contenido de ejemplo",
      defaultValue: false,
      admin: {
        position: "sidebar",
        description:
          "Mientras esté tildado, el sitio lo muestra marcado como ejemplo y no como nota oficial."
      }
    }
  ]
};
