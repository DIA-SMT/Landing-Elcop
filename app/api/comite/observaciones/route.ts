import { NextResponse } from "next/server";

import { registrarObservaciones } from "@/lib/portal/datos";
import { puedeVerTodasLasEntregas } from "@/lib/portal/roles";
import { LIMITES_OBSERVACIONES, validarObservaciones } from "@/lib/portal/validacion-entrega";
import { obtenerSesion } from "@/lib/sesion";

/**
 * El comité devuelve una entrega con observaciones.
 *
 * Es la primera ruta del portal donde **quien escribe no es el dueño de lo que
 * escribe**, así que la comprobación de permiso es lo primero y no un detalle:
 *
 * - **Sin sesión, 401.** Como en el resto del portal.
 * - **Sin rol de comité, 404 y no 403.** Un 403 confirmaría que la ruta existe y
 *   que hay algo del otro lado; a un becario que prueba direcciones a mano no le
 *   debemos esa información. Para quien tiene el rol, la ruta funciona; para el
 *   resto, no existe.
 * - **El rol se resuelve del documento de la sesión**, no de nada que venga en el
 *   cuerpo. `becarioId` en el JSON dice *a quién* se observa, nunca *quién*
 *   observa.
 */
export async function POST(request: Request) {
  const sesion = await obtenerSesion();
  if (!sesion) {
    return NextResponse.json({ ok: false, mensaje: "Iniciá sesión." }, { status: 401 });
  }

  if (!puedeVerTodasLasEntregas(sesion.documento)) {
    return NextResponse.json({ ok: false, mensaje: "No encontrado." }, { status: 404 });
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

  const { becarioId, observaciones } = cuerpo as {
    becarioId?: unknown;
    observaciones?: unknown;
  };

  if (typeof becarioId !== "string" || becarioId.trim() === "") {
    return NextResponse.json({ ok: false, mensaje: "Falta indicar la entrega." }, { status: 400 });
  }

  if (typeof observaciones !== "string") {
    return NextResponse.json({ ok: false, mensaje: "Faltan las observaciones." }, { status: 400 });
  }

  // Techo duro antes de validar fino, igual que en las otras rutas de escritura.
  if (observaciones.length > LIMITES_OBSERVACIONES.maximo * 2) {
    return NextResponse.json({ ok: false, mensaje: "La devolución es demasiado larga." }, { status: 400 });
  }

  const error = validarObservaciones(observaciones);
  if (error) {
    return NextResponse.json({ ok: false, errores: { observaciones: error } }, { status: 400 });
  }

  // `null` significa que esa entrega no está presentada: no se puede observar un
  // borrador que la persona todavía está escribiendo, ni una ya aprobada.
  const entrega = await registrarObservaciones(becarioId, observaciones);
  if (!entrega) {
    return NextResponse.json(
      {
        ok: false,
        errores: {
          general: "Esa entrega no está presentada, así que no se puede devolver con observaciones."
        }
      },
      { status: 409 }
    );
  }

  return NextResponse.json({ ok: true, entrega }, { status: 200 });
}
