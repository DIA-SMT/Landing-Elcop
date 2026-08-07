import type { CheckboxField, DateField, NumberField, TextField, UploadField } from "payload";

/**
 * Campos que se repiten en varias colecciones.
 *
 * Están acá para que las reglas del proyecto se escriban una sola vez: si el
 * criterio de "dato provisorio" cambia, cambia en un lugar.
 *
 * Son funciones y no constantes a propósito. `Field` es una unión enorme, y
 * copiar una constante con `{ ...campo, algo: 1 }` le hace perder a TypeScript
 * el discriminante que le dice de qué tipo de campo se trata: el error que sale
 * de ahí ocupa cuarenta líneas y no señala el problema real. Con funciones cada
 * campo declara su tipo concreto y las variantes se piden por parámetro.
 */

/**
 * Marca de dato provisorio.
 *
 * Traduce al panel una regla que hoy vive en comentarios `// TODO` del código:
 * ningún dato de demostración se presenta como oficial. Al migrar a un CMS esos
 * comentarios desaparecen, y con ellos el aviso, así que la marca pasa a ser un
 * campo por registro. La interfaz ya sabe qué hacer con él: es el mismo badge
 * que hoy muestra "Programa provisorio" y "Contenido de ejemplo".
 */
export const esProvisorio = (
  opciones: { porDefecto?: boolean; descripcion?: string } = {}
): CheckboxField => ({
  name: "esProvisorio",
  type: "checkbox",
  label: "Dato provisorio",
  defaultValue: opciones.porDefecto ?? false,
  admin: {
    description:
      opciones.descripcion ??
      "Mientras esté tildado, el sitio lo muestra marcado como provisorio. Destildalo cuando ELCOP confirme el dato."
  }
});

/**
 * Orden manual.
 *
 * Indicadores, ejes, integrantes y referentes se muestran en un orden que
 * significa algo: los ejes son un recorrido y el equipo tiene jerarquía. Si el
 * listado saliera por fecha de creación, el primer día que alguien edite un eje
 * se le va al final.
 */
export const orden = (): NumberField => ({
  name: "orden",
  type: "number",
  required: true,
  defaultValue: 0,
  admin: {
    position: "sidebar",
    step: 1,
    description: "El número menor aparece primero."
  }
});

/** Foto opcional. Sin ella, la interfaz muestra las iniciales sobre `sand`. */
export const foto = (): UploadField => ({
  name: "foto",
  type: "upload",
  relationTo: "media",
  required: false,
  admin: {
    description:
      "Opcional. Si no hay foto, el sitio muestra las iniciales; el espacio reservado es el mismo, así que sumarla después no mueve la maqueta."
  }
});

/**
 * Fuente y fecha de corte de un dato.
 *
 * Obligatorias en los datos de la ciudad: un número sin origen en un sitio
 * oficial no es un dato, es un pasivo.
 */
export const procedencia = (): [TextField, DateField] => [
  {
    name: "fuente",
    type: "text",
    required: true,
    admin: { description: "Organismo o publicación de donde sale el dato." }
  },
  {
    name: "fechaDeCorte",
    type: "date",
    required: true,
    admin: {
      description: "A qué fecha corresponde el dato.",
      date: { pickerAppearance: "monthOnly", displayFormat: "MM/yyyy" }
    }
  }
];
