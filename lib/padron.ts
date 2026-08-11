/**
 * El padrón de becarios: quién tiene derecho a entrar al portal.
 *
 * Esta es la pieza que educacivil no necesita y nosotros sí. Allá cualquier
 * vecino puede hacer los cursos; acá el portal es de las ochenta personas
 * seleccionadas.
 *
 * **CIDITUC autentica, este módulo autoriza.** El token de CIDITUC prueba que
 * alguien es quien dice ser, y nada más. Como el secreto de firma es compartido
 * entre todas las aplicaciones del municipio y el token no dice para cuál fue
 * emitido, uno emitido para la app de la maratón es indistinguible del nuestro.
 * Sin esta comprobación, cualquier vecino con cuenta entraría al portal.
 *
 * El padrón vive en la tabla `becarios`. Si la base no está configurada
 * —desarrollo sin credenciales—, cae a `ELCOP_PADRON_PROVISORIO`, que sirve
 * para probar el circuito sin depender de nada.
 */
import { baseDeDatos, falloDeBase } from "@/lib/supabase";

export type Becario = {
  /** Id en nuestra base. Hoy, el propio documento. */
  id: string;
  documento: string;
  nombre: string;
  cohorte: string;
};

/**
 * Busca un becario habilitado por su documento.
 *
 * Devuelve `null` si esa persona no está en el padrón, y ese `null` es el que
 * deja afuera a quien no corresponde.
 *
 * **Si la base está configurada y no responde, tira.** Convertir esa falla en
 * `null` le diría "no figurás entre los becarios" a alguien que sí figura, y lo
 * mandaría a reclamar por un problema que es nuestro. Quien llama lo traduce a
 * "el ingreso no está disponible".
 */
export async function buscarBecarioPorDocumento(documento: string): Promise<Becario | null> {
  const normalizado = normalizarDocumento(documento);
  if (!normalizado) return null;

  const base = baseDeDatos();
  if (base) {
    const { data, error } = await base
      .from("becarios")
      .select("documento, nombre, cohorte")
      .eq("documento", normalizado)
      .maybeSingle();

    if (error) falloDeBase("consultar el padrón", error);
    if (!data) return null;

    return {
      id: data.documento,
      documento: data.documento,
      // Puede faltar: el nombre del ingreso viene de CIDITUC y lo completa
      // quien llama.
      nombre: data.nombre ?? "",
      cohorte: data.cohorte ?? "2026"
    };
  }

  // Provisorio, para desarrollo sin base: documentos separados por coma.
  const habilitados = (process.env.ELCOP_PADRON_PROVISORIO ?? "")
    .split(",")
    .map((entrada) => normalizarDocumento(entrada))
    .filter((entrada): entrada is string => entrada !== null);

  if (!habilitados.includes(normalizado)) return null;

  return {
    id: normalizado,
    documento: normalizado,
    nombre: "",
    cohorte: process.env.ELCOP_COHORTE_ACTIVA ?? "2026"
  };
}

/**
 * Deja el documento en dígitos.
 *
 * CIDITUC guarda el documento como texto y no siempre con el mismo formato
 * —aparece con puntos, con espacios—, y nuestras postulaciones lo piden sin
 * puntos. Comparar las cadenas crudas haría que "30.456.789" y "30456789" sean
 * personas distintas.
 */
export function normalizarDocumento(valor: string | null | undefined): string | null {
  if (!valor) return null;
  const digitos = valor.replace(/\D/g, "");
  // Un DNI argentino tiene 7 u 8 dígitos. Un CUIL, 11: si viene el CUIL, se le
  // saca el prefijo de tipo y el dígito verificador.
  if (digitos.length === 11) return digitos.slice(2, 10);
  if (digitos.length >= 7 && digitos.length <= 8) return digitos;
  return null;
}
