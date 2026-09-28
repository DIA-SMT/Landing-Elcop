/**
 * Dónde van a parar las postulaciones.
 *
 * Antes no iban a ningún lado: el endpoint devolvía 200 y perdía los datos.
 * Ahora van a la tabla `postulaciones` (migración 0003).
 *
 * **Sin base configurada no se inventa un guardado.** `guardar` devuelve
 * `"sin-base"`, el endpoint lo pasa al formulario y el formulario dice que el
 * envío no quedó registrado. Es la misma regla que el resto del proyecto: nada
 * provisorio se muestra como si fuera definitivo.
 */
import { normalizarDocumento } from "@/lib/padron";
import { baseDeDatos } from "@/lib/supabase";
import type { ValoresPostulacion } from "@/lib/postulacion-validacion";

export type ResultadoPostulacion = "guardada" | "duplicada" | "sin-base" | "falla";

/** Código de Postgres para violación de restricción única. */
const CLAVE_DUPLICADA = "23505";

export function cohorteActiva(): string {
  return process.env.ELCOP_COHORTE_ACTIVA ?? "2026";
}

/**
 * Guarda una postulación ya validada.
 *
 * Distingue "duplicada" de "guardada" porque no son lo mismo para quien está
 * del otro lado: la primera merece "ya la teníamos" y no un error rojo.
 */
export async function guardar(valores: ValoresPostulacion): Promise<ResultadoPostulacion> {
  const base = baseDeDatos();
  if (!base) {
    // No se loguea el cuerpo: son datos personales (DNI, teléfono, fecha de
    // nacimiento) y no tienen por qué quedar en los logs del servidor.
    console.info("[postulacion] recibida sin base configurada", {
      campos: Object.keys(valores).length,
      recibidaEn: new Date().toISOString()
    });
    return "sin-base";
  }

  const { error } = await base.from("postulaciones").insert({
    nombre: valores.nombre.trim(),
    // El DNI se guarda normalizado (solo dígitos) para que la restricción única
    // y las búsquedas no dependan de si alguien escribió los puntos.
    dni: normalizarDocumento(valores.dni) ?? valores.dni.replace(/\D/g, ""),
    nacimiento: valores.nacimiento,
    email: valores.email.trim().toLowerCase(),
    telefono: valores.telefono.trim(),
    localidad: valores.localidad.trim(),
    ocupacion: valores.ocupacion.trim(),
    nivel_educativo: valores.nivelEducativo.trim(),
    motivacion: valores.motivacion.trim(),
    cohorte: cohorteActiva()
  });

  if (error) {
    if (error.code === CLAVE_DUPLICADA) return "duplicada";
    // Se registra el código, nunca la fila: son datos personales. Quien llama
    // traduce esto a un 503, como el resto de las rutas del proyecto.
    console.warn(`[base] guardar la postulación falló — ${error.code ?? "?"}: ${error.message}`);
    return "falla";
  }

  return "guardada";
}
