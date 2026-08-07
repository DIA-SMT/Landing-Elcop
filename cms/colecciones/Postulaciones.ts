import type { CollectionConfig } from "payload";

import { equipoElcop, soloAdmin } from "../acceso";

/**
 * Las postulaciones que llegan del formulario público.
 *
 * Tres decisiones que conviene defender:
 *
 * 1. **Nadie las crea desde el panel.** Se crean sólo desde el formulario, por
 *    el endpoint del sitio. `create: () => false` cierra la puerta del panel.
 * 2. **Los datos declarados son de sólo lectura.** El panel sirve para leer y
 *    clasificar, no para editar lo que otra persona declaró. Lo editable es el
 *    estado y las notas internas.
 * 3. **Sólo la dirección puede borrar.** Son datos personales de más de mil
 *    personas; borrar no debería ser un clic distraído de cualquiera.
 *
 * Con 1.091 postulaciones en la primera convocatoria, el listado necesita
 * búsqueda, filtro por estado y exportación. Sin eso es inservible.
 */
const soloLectura = { readOnly: true } as const;

export const Postulaciones: CollectionConfig = {
  slug: "postulaciones",
  labels: { singular: "Postulación", plural: "Postulaciones" },
  admin: {
    useAsTitle: "nombre",
    group: "Inscripciones",
    defaultColumns: ["nombre", "email", "localidad", "estado", "recibidaEn"],
    description: "Llegan del formulario público. No se cargan a mano."
  },
  defaultSort: "-recibidaEn",
  access: {
    read: equipoElcop,
    // Entran por el endpoint del formulario, nunca desde el panel.
    create: () => false,
    update: equipoElcop,
    delete: soloAdmin
  },
  fields: [
    // --- Lo que declaró la persona. Inmutable desde el panel. ---
    { name: "nombre", type: "text", required: true, admin: soloLectura },
    { name: "dni", type: "text", required: true, index: true, admin: soloLectura },
    { name: "nacimiento", type: "date", required: true, admin: soloLectura },
    { name: "email", type: "email", required: true, index: true, admin: soloLectura },
    { name: "telefono", type: "text", required: true, admin: soloLectura },
    { name: "localidad", type: "text", required: true, admin: soloLectura },
    { name: "ocupacion", type: "text", required: true, admin: soloLectura },
    { name: "nivelEducativo", type: "text", required: true, admin: soloLectura },
    { name: "motivacion", type: "textarea", required: true, admin: soloLectura },

    // --- Lo que agrega la coordinación. ---
    {
      name: "estado",
      type: "select",
      required: true,
      defaultValue: "recibida",
      options: [
        { label: "Recibida", value: "recibida" },
        { label: "Entrevistada", value: "entrevistada" },
        { label: "Seleccionada", value: "seleccionada" },
        { label: "No seleccionada", value: "no-seleccionada" }
      ],
      admin: { position: "sidebar" }
    },
    {
      name: "notasInternas",
      type: "textarea",
      required: false,
      admin: { description: "Sólo lo ve el equipo. No se muestra en ningún lado del sitio." }
    },
    {
      name: "recibidaEn",
      type: "date",
      required: true,
      admin: {
        position: "sidebar",
        readOnly: true,
        date: { pickerAppearance: "dayAndTime", displayFormat: "dd/MM/yyyy HH:mm" }
      }
    },
    {
      name: "cohorte",
      type: "text",
      required: true,
      admin: { position: "sidebar", readOnly: true, description: "A qué convocatoria corresponde." }
    }
  ]
};
