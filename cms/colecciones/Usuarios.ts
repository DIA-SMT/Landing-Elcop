import type { CollectionConfig } from "payload";

import { conSesion, soloAdmin } from "../acceso";

/**
 * Cuentas del sistema: equipo de ELCOP y becarios.
 *
 * **No hay registro público.** Las cuentas de becario se crean a partir de las
 * postulaciones marcadas como seleccionadas, y se invitan por email. Que el
 * conjunto de usuarios sea cerrado es una propiedad de seguridad que conviene
 * conservar, así que sólo la dirección puede crear cuentas.
 */
export const Usuarios: CollectionConfig = {
  slug: "usuarios",
  labels: { singular: "Usuario", plural: "Usuarios" },
  auth: {
    // El alta la hace la dirección y la persona define su contraseña desde el
    // enlace que le llega por email.
    verify: false,
    // Freno a la fuerza bruta: cinco intentos y la cuenta queda bloqueada
    // diez minutos.
    maxLoginAttempts: 5,
    lockTime: 10 * 60 * 1000
  },
  admin: { useAsTitle: "email", group: "Sistema", defaultColumns: ["email", "nombre", "rol"] },
  access: {
    read: conSesion,
    create: soloAdmin,
    update: soloAdmin,
    delete: soloAdmin,
    // El becario no entra al panel de administración: usa el portal del sitio.
    // El docente sí, pero sólo alcanza su material y sus encuentros.
    admin: ({ req }) => {
      const rol = (req.user as { rol?: string } | null)?.rol;
      return rol === "admin" || rol === "staff" || rol === "docente";
    }
  },
  fields: [
    { name: "nombre", type: "text", required: true },
    {
      name: "rol",
      type: "select",
      required: true,
      defaultValue: "becario",
      options: [
        { label: "Dirección (todo)", value: "admin" },
        { label: "Coordinación (contenido, postulaciones y cursada)", value: "staff" },
        { label: "Docente (sus encuentros y su material)", value: "docente" },
        { label: "Becario (sólo el portal)", value: "becario" }
      ],
      admin: { position: "sidebar" }
    },
    {
      name: "cohorte",
      type: "text",
      required: false,
      admin: {
        position: "sidebar",
        description: "Sólo para becarios. Ej: 2026.",
        condition: (datos) => datos?.rol === "becario"
      }
    },
    {
      // Deja el rastro de qué postulación dio origen a esta cuenta.
      name: "postulacion",
      type: "relationship",
      relationTo: "postulaciones",
      required: false,
      admin: {
        position: "sidebar",
        readOnly: true,
        condition: (datos) => datos?.rol === "becario"
      }
    }
  ]
};
