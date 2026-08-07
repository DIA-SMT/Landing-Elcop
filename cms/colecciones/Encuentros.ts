import type { CollectionConfig } from "payload";

import { equipoElcop, portal } from "../acceso";

/**
 * El calendario de la cursada. Es la pieza que faltaba: sin encuentros con
 * fecha no hay "próxima sesión", no hay "clases recientes", y sobre todo la
 * asistencia no tiene de qué colgarse.
 *
 * **Qué cuenta para el 75%.** Sólo los encuentros presenciales, y sólo los que
 * efectivamente se dictaron. Los virtuales viven en el calendario pero no suman
 * ni restan. Y los cancelados salen del denominador: si una clase se cae, no
 * puede jugar en contra de la regularidad de nadie. Por eso `estado` no es un
 * adorno, es parte del cálculo.
 *
 * **Sobre el QR.** Un código fijo no mide nada: el primero que llega le saca
 * una foto y la manda al grupo. Lo que se guarda acá es el secreto del que se
 * derivan códigos que rotan cada 30 segundos, y la ventana en la que el
 * autoregistro está abierto. La rotación es lógica de la aplicación; el
 * esquema sólo guarda de qué semilla sale y entre qué horas vale.
 */
export const Encuentros: CollectionConfig = {
  slug: "encuentros",
  labels: { singular: "Encuentro", plural: "Encuentros" },
  admin: {
    useAsTitle: "titulo",
    group: "Cursada",
    defaultColumns: ["titulo", "modulo", "comienza", "modalidad", "estado"],
    description: "El calendario de clases. De acá salen la asistencia y el material."
  },
  defaultSort: "-comienza",
  access: {
    // Todo el portal lee el calendario; sólo el equipo lo edita. Los docentes
    // no crean encuentros: los carga la coordinación y después ellos suben su
    // material.
    read: portal,
    create: equipoElcop,
    update: equipoElcop,
    delete: equipoElcop
  },
  fields: [
    { name: "titulo", type: "text", required: true },
    {
      name: "modulo",
      type: "relationship",
      relationTo: "modulos",
      required: true,
      admin: {
        position: "sidebar",
        description: "El módulo al que pertenece. El eje se deduce del módulo."
      }
    },
    {
      // Las masterclass son encuentros como cualquier otro, con una marca. Es
      // lo que hacía el prototipo y evita cargar dos veces lo mismo: la ficha
      // pública del disertante vive una sola vez, en Referentes.
      name: "esMasterclass",
      type: "checkbox",
      defaultValue: false,
      admin: { position: "sidebar" }
    },
    {
      name: "referente",
      type: "relationship",
      relationTo: "referentes",
      required: false,
      admin: {
        description: "Quién dicta la masterclass. Es la misma ficha que se muestra en el sitio público.",
        condition: (datos) => Boolean(datos?.esMasterclass)
      }
    },
    {
      name: "docentes",
      type: "relationship",
      relationTo: "usuarios",
      hasMany: true,
      required: false,
      filterOptions: { rol: { equals: "docente" } },
      admin: { description: "Quiénes dictan el encuentro. Define qué material pueden subir." }
    },
    {
      name: "comienza",
      type: "date",
      required: true,
      admin: { date: { pickerAppearance: "dayAndTime", displayFormat: "dd/MM/yyyy HH:mm" } }
    },
    {
      name: "termina",
      type: "date",
      required: true,
      admin: { date: { pickerAppearance: "dayAndTime", displayFormat: "dd/MM/yyyy HH:mm" } }
    },
    {
      name: "modalidad",
      type: "select",
      required: true,
      defaultValue: "presencial",
      options: [
        { label: "Presencial (cuenta para el 75%)", value: "presencial" },
        { label: "Virtual sincronizada (no cuenta)", value: "virtual" }
      ],
      admin: { position: "sidebar" }
    },
    {
      name: "estado",
      type: "select",
      required: true,
      defaultValue: "programado",
      options: [
        { label: "Programado", value: "programado" },
        { label: "Dictado", value: "dictado" },
        { label: "Cancelado (sale del cálculo)", value: "cancelado" }
      ],
      admin: {
        position: "sidebar",
        description: "Un encuentro cancelado no cuenta en el total de asistencia."
      }
    },
    {
      name: "lugar",
      type: "text",
      required: false,
      admin: {
        description: "Aula o sede.",
        condition: (datos) => datos?.modalidad === "presencial"
      }
    },
    {
      name: "enlace",
      type: "text",
      required: false,
      admin: {
        description: "Enlace de la videollamada.",
        condition: (datos) => datos?.modalidad === "virtual"
      }
    },
    {
      name: "autoregistro",
      type: "group",
      label: "Registro de asistencia por QR",
      admin: {
        description: "Sólo aplica a encuentros presenciales.",
        condition: (datos) => datos?.modalidad === "presencial"
      },
      fields: [
        {
          name: "habilitado",
          type: "checkbox",
          defaultValue: true,
          admin: { description: "Si se destilda, la asistencia se carga sólo a mano." }
        },
        {
          name: "abreA",
          type: "date",
          required: false,
          admin: {
            description: "Desde cuándo se puede marcar. Por defecto, el horario de inicio.",
            date: { pickerAppearance: "dayAndTime", displayFormat: "dd/MM/yyyy HH:mm" }
          }
        },
        {
          name: "cierraA",
          type: "date",
          required: false,
          admin: {
            description: "Hasta cuándo. Fuera de esta ventana el código no vale.",
            date: { pickerAppearance: "dayAndTime", displayFormat: "dd/MM/yyyy HH:mm" }
          }
        },
        {
          name: "semilla",
          type: "text",
          required: false,
          admin: {
            readOnly: true,
            hidden: true,
            description:
              "Secreto del que se derivan los códigos rotativos. Lo genera el sistema y no se muestra."
          }
        }
      ]
    }
  ]
};
