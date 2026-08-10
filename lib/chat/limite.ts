/**
 * Límite de frecuencia del chat.
 *
 * Un endpoint público que gasta tokens pagos en cada llamada no es como el
 * resto del sitio: sin freno, cualquiera con un bucle de tres líneas convierte
 * la cuenta de OpenRouter en una factura. El razonamiento es el mismo que
 * `PENDIENTES.md` ya tiene escrito para el formulario de postulación; acá
 * además hay costo por uso.
 *
 * ⚠️ **Es memoria del proceso, igual que los almacenes del portal.** En un
 * despliegue serverless cada instancia lleva su propia cuenta, así que el límite
 * real es el que se configura acá multiplicado por la cantidad de instancias
 * vivas. Frena el abuso casero y el bucle accidental; no frena a alguien
 * decidido. Para eso hace falta un contador compartido —Redis, o el límite del
 * propio proveedor— y queda anotado como pendiente.
 */

import { almacen } from "@/lib/almacen";

/** Ventana y techo. Conservador a propósito: una conversación normal no los roza. */
export const LIMITE = {
  ventanaMs: 60_000,
  porVentana: 8,
  /** Techo por día y por visitante, para que una sola persona no drene la cuenta. */
  porDia: 60
} as const;

type Registro = { recientes: number[]; delDia: number; diaUtc: number };

const registros = almacen<Registro>("limite-chat");

function diaActual(ahora: number): number {
  return Math.floor(ahora / 86_400_000);
}

/**
 * Identifica al visitante lo más groseramente posible: sólo la IP.
 *
 * No se guarda nada más —ni el mensaje, ni el agente de usuario— porque para
 * contar llamadas no hace falta, y todo lo que se guarda de más es algo que hay
 * que justificar después ante quien pregunte por datos personales.
 */
export function identificar(request: Request): string {
  const reenviada = request.headers.get("x-forwarded-for");
  if (reenviada) return reenviada.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "desconocida";
}

export type Veredicto = { permitido: true } | { permitido: false; motivo: string; esperarSeg: number };

/** Cuenta esta llamada y decide si pasa. */
export function permitirLlamada(clave: string, ahora = Date.now()): Veredicto {
  const hoy = diaActual(ahora);

  const registro = registros.get(clave) ?? { recientes: [], delDia: 0, diaUtc: hoy };
  if (registro.diaUtc !== hoy) {
    registro.diaUtc = hoy;
    registro.delDia = 0;
  }

  registro.recientes = registro.recientes.filter((t) => ahora - t < LIMITE.ventanaMs);

  if (registro.delDia >= LIMITE.porDia) {
    registros.set(clave, registro);
    return {
      permitido: false,
      motivo: "Llegaste al máximo de consultas por hoy. Escribinos por el formulario del sitio.",
      esperarSeg: 3600
    };
  }

  if (registro.recientes.length >= LIMITE.porVentana) {
    registros.set(clave, registro);
    const masViejo = registro.recientes[0]!;
    return {
      permitido: false,
      motivo: "Estás escribiendo muy rápido. Esperá unos segundos y probá de nuevo.",
      esperarSeg: Math.max(1, Math.ceil((LIMITE.ventanaMs - (ahora - masViejo)) / 1000))
    };
  }

  registro.recientes.push(ahora);
  registro.delDia += 1;
  registros.set(clave, registro);

  // El Map crecería sin techo con tráfico real: se poda cuando se hace grande.
  if (registros.size > 5000) {
    for (const [k, v] of registros) {
      if (v.recientes.length === 0 && v.diaUtc !== hoy) registros.delete(k);
    }
  }

  return { permitido: true };
}
