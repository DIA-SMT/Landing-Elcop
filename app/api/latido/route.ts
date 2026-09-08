import { baseDeDatos } from "@/lib/supabase";

/**
 * El latido: una consulta mínima que mantiene viva la base.
 *
 * Existe por un incidente real. Supabase (plan gratuito) pausa el proyecto
 * tras ~7 días sin actividad, y el 8/9/2026 lo encontramos pausado: un mes sin
 * uso y el ingreso al portal estuvo caído semanas sin que nadie lo notara. Un
 * cron de GitHub (.github/workflows/latido.yml) llama a esta ruta dos veces
 * por día: la actividad evita la pausa, y si la base igual se cae, el cron
 * falla y GitHub avisa por email — monitoreo gratis de yapa.
 *
 * La consulta es un conteo con `head: true`: viaja el número, no las filas.
 * No expone ningún dato y no requiere autenticación; lo peor que puede hacer
 * quien la llame de más es mantenernos la base despierta.
 */

// Sin caché: un latido servido de la CDN no despierta a nadie.
export const dynamic = "force-dynamic";

export async function GET() {
  const respuesta = (estado: number, cuerpo: Record<string, unknown>) =>
    Response.json(cuerpo, { status: estado, headers: { "Cache-Control": "no-store" } });

  const base = baseDeDatos();
  if (!base) {
    // Sin base configurada el latido no tiene a quién mantener despierto, y en
    // producción eso es un problema de configuración: se avisa con el estado.
    console.warn("[base] latido sin base configurada");
    return respuesta(503, { ok: false });
  }

  const { error } = await base.from("becarios").select("*", { count: "exact", head: true });

  if (error) {
    // El detalle va a los registros, nunca al que llama: la ruta es pública.
    console.warn(`[base] latido falló — ${error.code ?? "?"}: ${error.message}`);
    return respuesta(503, { ok: false });
  }

  return respuesta(200, { ok: true });
}
