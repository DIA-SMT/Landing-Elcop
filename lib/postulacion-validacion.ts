/**
 * Las reglas de validación de la postulación, en un solo lugar.
 *
 * Vivían dentro de `FormularioPostulacion`. Se movieron acá cuando el endpoint
 * pasó a guardar de verdad: el servidor tiene que validar con las mismas reglas
 * que el formulario, porque nada impide postear al endpoint sin pasar por la
 * pantalla. Tenerlas duplicadas era garantizar que se separaran.
 *
 * El módulo es isomórfico a propósito —lo importan el componente de cliente y
 * la ruta de API—, así que no toca nada del servidor.
 */
import { FORMULARIO, type CampoFormulario } from "@/content/elcop";

export type ValoresPostulacion = Record<string, string>;
export type ErroresPostulacion = Record<string, string>;

export const MINIMO_MOTIVACION = 100;

/** Reglas de validación por campo. Devuelve el mensaje de error o `null`. */
export function validarCampo(campo: CampoFormulario, valor: string): string | null {
  const limpio = valor.trim();

  if (campo.requerido && limpio === "") {
    return campo.tipo === "select"
      ? `Elegí una opción en «${campo.etiqueta}».`
      : `Completá el campo «${campo.etiqueta}».`;
  }
  if (limpio === "") return null;

  switch (campo.id) {
    case "nombre":
      if (limpio.length < 3) return "Escribí tu nombre y apellido completos.";
      return null;

    case "dni":
      if (!/^\d{7,8}$/.test(limpio.replace(/\./g, ""))) {
        return "El DNI se escribe sin puntos, con 7 u 8 dígitos.";
      }
      return null;

    case "nacimiento": {
      const fecha = new Date(`${limpio}T00:00:00`);
      if (Number.isNaN(fecha.getTime())) return "Ingresá una fecha válida.";
      const hoy = new Date();
      if (fecha > hoy) return "La fecha de nacimiento no puede ser futura.";
      // Edad cumplida a la fecha de hoy.
      let edad = hoy.getFullYear() - fecha.getFullYear();
      const mes = hoy.getMonth() - fecha.getMonth();
      if (mes < 0 || (mes === 0 && hoy.getDate() < fecha.getDate())) edad -= 1;
      if (edad < 16) return "Tenés que tener al menos 16 años para postularte.";
      if (edad > 110) return "Revisá el año: la fecha parece incorrecta.";
      return null;
    }

    case "email":
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(limpio)) {
        return "Revisá el email: falta el @ o el dominio.";
      }
      return null;

    case "telefono": {
      const digitos = limpio.replace(/\D/g, "");
      if (digitos.length < 8) return "Ingresá el teléfono con característica, sin el 0 ni el 15.";
      return null;
    }

    case "localidad":
    case "ocupacion":
      if (limpio.length < 2) return "Este dato es muy corto, escribilo completo.";
      return null;

    case "motivacion": {
      if (limpio.length < MINIMO_MOTIVACION) {
        return `Contanos un poco más: faltan ${MINIMO_MOTIVACION - limpio.length} caracteres.`;
      }
      if (campo.maximoCaracteres && limpio.length > campo.maximoCaracteres) {
        return `Te pasaste del máximo de ${campo.maximoCaracteres} caracteres.`;
      }
      return null;
    }

    default:
      return null;
  }
}

/**
 * Valida la postulación entera. Devuelve un objeto vacío si está bien.
 *
 * Ignora las claves que no correspondan a un campo del formulario: si alguien
 * postea basura de más, no se valida ni se guarda, simplemente se descarta.
 */
export function validarPostulacion(valores: ValoresPostulacion): ErroresPostulacion {
  const errores: ErroresPostulacion = {};
  for (const campo of FORMULARIO.campos) {
    const error = validarCampo(campo, valores[campo.id] ?? "");
    if (error) errores[campo.id] = error;
  }
  return errores;
}
