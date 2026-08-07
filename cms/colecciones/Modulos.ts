import type { CollectionConfig } from "payload";

import { cualquiera, equipoElcop } from "../acceso";
import { orden } from "../campos";

/**
 * El nivel intermedio de la cursada: cada eje se divide en módulos y cada
 * módulo agrupa sus encuentros.
 *
 * Sale del prototipo, que ya tenía los tres niveles. La jerarquía completa
 * queda: **eje → módulo → encuentro**, y el material puede colgar de cualquiera
 * de los dos últimos.
 */
export const Modulos: CollectionConfig = {
  slug: "modulos",
  labels: { singular: "Módulo", plural: "Módulos" },
  admin: {
    useAsTitle: "nombre",
    group: "Formación",
    defaultColumns: ["nombre", "eje", "orden"],
    description: "Las unidades temáticas en que se divide cada eje."
  },
  defaultSort: "orden",
  access: { read: cualquiera, create: equipoElcop, update: equipoElcop, delete: equipoElcop },
  fields: [
    { name: "nombre", type: "text", required: true },
    {
      name: "descripcion",
      type: "textarea",
      required: false,
      admin: { description: "Una línea sobre qué se trabaja en el módulo." }
    },
    {
      name: "eje",
      type: "relationship",
      relationTo: "ejes",
      required: true,
      admin: { position: "sidebar", description: "A qué eje de la diplomatura pertenece." }
    },
    orden()
  ]
};
