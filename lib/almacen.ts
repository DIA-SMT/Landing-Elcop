/**
 * Almacenes en memoria, hasta que exista la base de datos.
 *
 * Había tres copias de este patrón —las consultas de mentoría, los proyectos
 * finales y el contador del chat—, cada una con su `Map` colgado de `globalThis`
 * y su propia advertencia repetida. Es un solo concepto, así que vive en un solo
 * lugar.
 *
 * ⚠️ **Esto no es persistencia, y la diferencia importa:**
 *
 * - **Un reinicio del servidor lo vacía.** No hay disco de por medio.
 * - **En serverless cada instancia lleva el suyo.** En Vercel, dos pedidos
 *   seguidos pueden ver estados distintos.
 *
 * Alcanza para probar los circuitos completos —escribir, ver lo escrito, que el
 * servidor valide— y para nada más. **Ningún dato real de una persona puede
 * depender de esto:** cuando exista la base, cada `almacen()` se reemplaza por
 * una consulta y las pantallas no se enteran.
 *
 * Se cuelga de `globalThis` para sobrevivir a la recompilación en caliente de
 * Next, que reinicia los módulos pero no el proceso. Sin eso, cada vez que se
 * guarda un archivo en desarrollo se perdería lo que se estaba probando.
 */

const raiz = globalThis as unknown as { __almacenesElcop?: Map<string, Map<string, unknown>> };

/**
 * Devuelve el almacén con ese nombre, creándolo la primera vez.
 *
 * El nombre identifica el conjunto de datos —`"consultas"`, `"entregas"`— y el
 * tipo lo pone quien llama. No hay validación de que el mismo nombre se use
 * siempre con el mismo tipo: son tres usos en el mismo repositorio y agregar un
 * registro de tipos para eso sería más código que el que protege.
 */
export function almacen<T>(nombre: string): Map<string, T> {
  raiz.__almacenesElcop ??= new Map();

  const existente = raiz.__almacenesElcop.get(nombre);
  if (existente) return existente as Map<string, T>;

  const nuevo = new Map<string, T>();
  raiz.__almacenesElcop.set(nombre, nuevo as Map<string, unknown>);
  return nuevo;
}
