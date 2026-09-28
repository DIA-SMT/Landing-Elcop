/**
 * Si hay o no una convocatoria abierta.
 *
 * Vive en una variable de entorno y no en el contenido porque es un interruptor
 * de operación, no un texto que alguien redacta.
 *
 * **Cambiarla exige volver a desplegar.** La home es estática (`next build` la
 * prerenderiza), así que este `process.env` se lee en el build y no en cada
 * pedido: verificado corriendo `next start` con la variable en "false" sin
 * rebuild, que sigue sirviendo el estado abierto. No es un problema práctico
 * —todo el contenido del sitio vive en `content/elcop.ts` y ya exige desplegar
 * para cambiar una coma—, pero conviene saberlo antes de buscar por qué "no
 * tomó". Si alguna vez tiene que cambiarse en caliente, alcanza con
 * `export const dynamic = "force-dynamic"` en `app/page.tsx`, al precio de
 * renderizar la landing en cada visita.
 *
 * **Por omisión está abierta**, que es como venía funcionando el sitio: cerrar
 * es la acción explícita. ELCOP todavía no confirmó en qué estado está hoy, así
 * que el interruptor queda construido y apagado.
 */
export function convocatoriaAbierta(): boolean {
  return process.env.ELCOP_CONVOCATORIA_ABIERTA !== "false";
}
