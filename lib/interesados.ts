/**
 * Quiénes quieren que les avisemos cuando abra la próxima convocatoria.
 *
 * Es el destino del formulario que aparece cuando no hay convocatoria abierta.
 * Se pide lo mínimo —nombre, mail y, si quiere, teléfono—: para mandar una
 * novedad no hace falta el DNI ni la fecha de nacimiento, y pedir datos
 * personales que no se van a usar es la clase de cosa que después hay que
 * justificar.
 */
import { baseDeDatos } from "@/lib/supabase";

export type DatosInteresado = { nombre: string; email: string; telefono?: string };
export type ResultadoInteresado = "registrado" | "ya-estaba" | "sin-base" | "falla";

const CLAVE_DUPLICADA = "23505";

export async function registrar(datos: DatosInteresado): Promise<ResultadoInteresado> {
  const base = baseDeDatos();
  if (!base) {
    console.info("[interesados] registro sin base configurada", {
      recibidoEn: new Date().toISOString()
    });
    return "sin-base";
  }

  const telefono = datos.telefono?.trim();
  const { error } = await base.from("interesados").insert({
    nombre: datos.nombre.trim(),
    email: datos.email.trim().toLowerCase(),
    telefono: telefono ? telefono : null
  });

  if (error) {
    // Dejar el mail dos veces es lo esperable cuando no llega respuesta: para
    // la persona es un éxito, no un error.
    if (error.code === CLAVE_DUPLICADA) return "ya-estaba";
    console.warn(`[base] registrar el interesado falló — ${error.code ?? "?"}: ${error.message}`);
    return "falla";
  }

  return "registrado";
}
