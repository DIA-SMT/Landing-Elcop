import { NextResponse } from "next/server";

import { entregaAbierta } from "@/lib/portal/calculos";
import { entregaGuardada, entregaVacia, fechaLimiteEntrega, guardarEntrega } from "@/lib/portal/datos";
import { SECCIONES_PROYECTO, type SeccionProyecto } from "@/lib/portal/tipos";
import {
  LIMITES_ENTREGA,
  hayErrores,
  validarBorrador,
  validarPresentacion
} from "@/lib/portal/validacion-entrega";
import { obtenerSesion } from "@/lib/sesion";

/**
 * Guarda el proyecto final del becario, como borrador o presentado.
 *
 * Mismas reglas que `/api/portal/consultas`, que es donde quedaron sentadas: sin
 * sesión no hay POST, la identidad sale de la cookie y nunca del cuerpo, el
 * servidor revalida todo, y lo que se guarda es texto plano que nadie interpreta
 * como marcado.
 *
 * Lo propio de esta ruta:
 *
 * - **`presentar` decide qué validación corre.** Un borrador puede estar
 *   incompleto; una presentación no. Si el cliente pide presentar algo a medias,
 *   se rechaza con los errores por campo.
 * - **La fecha límite se comprueba acá.** Una fecha límite que sólo se controla
 *   en el navegador no es una fecha límite. Hoy no hay fecha definida —ítem 22—,
 *   así que no rechaza por vencimiento; el día que ELCOP la confirme, empieza a
 *   hacerlo sin tocar esta ruta.
 * - **Una entrega aprobada no se sobreescribe**, aunque sobre tiempo.
 */

/** Techo duro por campo, antes de validar fino: 2× el máximo real. */
function excedeElTecho(titulo: string, resumen: string, secciones: Record<string, string>): boolean {
  if (titulo.length > LIMITES_ENTREGA.titulo.maximo * 2) return true;
  if (resumen.length > LIMITES_ENTREGA.resumen.maximo * 2) return true;
  return Object.values(secciones).some((t) => t.length > LIMITES_ENTREGA.seccion.maximo * 2);
}

/**
 * Se queda con las cinco secciones conocidas y descarta el resto.
 *
 * Devuelve `null` si alguna no es texto. No se confía en las claves que manda el
 * cliente: un campo extra terminaría guardado sin que nada lo valide.
 */
function leerSecciones(valor: unknown): Record<SeccionProyecto, string> | null {
  if (typeof valor !== "object" || valor === null) return null;
  const entrada = valor as Record<string, unknown>;
  const salida = {} as Record<SeccionProyecto, string>;

  for (const seccion of SECCIONES_PROYECTO) {
    const texto = entrada[seccion];
    if (texto === undefined || texto === null) {
      salida[seccion] = "";
      continue;
    }
    if (typeof texto !== "string") return null;
    salida[seccion] = texto;
  }

  return salida;
}

export async function POST(request: Request) {
  const sesion = await obtenerSesion();
  if (!sesion) {
    return NextResponse.json(
      { ok: false, mensaje: "Iniciá sesión para guardar tu proyecto." },
      { status: 401 }
    );
  }

  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
  } catch {
    return NextResponse.json({ ok: false, mensaje: "El cuerpo no es JSON válido." }, { status: 400 });
  }

  if (typeof cuerpo !== "object" || cuerpo === null) {
    return NextResponse.json({ ok: false, mensaje: "Se esperaba un objeto." }, { status: 400 });
  }

  const { titulo, resumen, secciones, presentar } = cuerpo as {
    titulo?: unknown;
    resumen?: unknown;
    secciones?: unknown;
    presentar?: unknown;
  };

  if (typeof titulo !== "string" || typeof resumen !== "string") {
    return NextResponse.json(
      { ok: false, mensaje: "Faltan el título o el resumen." },
      { status: 400 }
    );
  }

  const leidas = leerSecciones(secciones);
  if (!leidas) {
    return NextResponse.json(
      { ok: false, mensaje: "Las secciones del proyecto no son válidas." },
      { status: 400 }
    );
  }

  if (excedeElTecho(titulo, resumen, leidas)) {
    return NextResponse.json({ ok: false, mensaje: "El proyecto es demasiado largo." }, { status: 400 });
  }

  // La entrega actual y la fecha límite: las dos hacen falta para saber si esta
  // persona todavía puede escribir.
  const actual = entregaGuardada(sesion.becarioId) ?? entregaVacia();
  const fechaLimite = await fechaLimiteEntrega();

  if (!entregaAbierta(actual, fechaLimite)) {
    const motivo =
      actual.estado === "aprobado"
        ? "Tu proyecto ya está aprobado, así que no se puede seguir editando."
        : "La fecha límite para presentar ya pasó.";
    return NextResponse.json({ ok: false, errores: { general: motivo } }, { status: 409 });
  }

  const quierePresentar = presentar === true;
  const datos = { titulo, resumen, secciones: leidas };
  const errores = quierePresentar ? validarPresentacion(datos) : validarBorrador(datos);

  if (hayErrores(errores)) {
    return NextResponse.json({ ok: false, errores }, { status: 400 });
  }

  const entrega = await guardarEntrega(sesion.becarioId, {
    titulo,
    resumen,
    secciones: leidas,
    presentar: quierePresentar
  });

  return NextResponse.json({ ok: true, entrega }, { status: 200 });
}
