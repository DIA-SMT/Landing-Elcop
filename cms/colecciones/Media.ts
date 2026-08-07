import type { CollectionConfig } from "payload";

import { cualquiera, equipoElcop } from "../acceso";

/**
 * Archivos subidos: fotos del equipo, portadas de publicaciones, imágenes de
 * las clases.
 *
 * Una regla no negociable: **`alt` es obligatorio**.
 *
 * Hoy el sitio da 100 en Accesibilidad. La forma más común de perder ese número
 * después de migrar a un CMS es que alguien suba una imagen sin texto
 * alternativo. Si el campo es obligatorio en el esquema, el panel no deja
 * guardar y el problema nunca llega a producción.
 */
export const Media: CollectionConfig = {
  slug: "media",
  labels: { singular: "Archivo", plural: "Archivos" },
  admin: { useAsTitle: "alt", group: "Sistema" },
  access: {
    // Las imágenes se sirven en el sitio público.
    read: cualquiera,
    create: equipoElcop,
    update: equipoElcop,
    delete: equipoElcop
  },
  upload: {
    mimeTypes: ["image/jpeg", "image/png", "image/webp", "image/avif"],
    // Tamaños generados al subir, para que next/image no tenga que
    // redimensionar en cada visita.
    imageSizes: [
      { name: "portada", width: 1200, height: 675, position: "centre" },
      { name: "retrato", width: 600, height: 600, position: "centre" },
      { name: "miniatura", width: 400, height: 225, position: "centre" }
    ],
    adminThumbnail: "miniatura"
  },
  fields: [
    {
      name: "alt",
      type: "text",
      required: true,
      admin: {
        description:
          "Qué se ve en la imagen, para quien no puede verla. Describí el contenido, no escribas 'foto de'."
      }
    },
    {
      name: "credito",
      type: "text",
      required: false,
      admin: { description: "Autoría de la foto, si corresponde acreditarla." }
    }
  ]
};
