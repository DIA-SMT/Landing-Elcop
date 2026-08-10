import { NextResponse } from "next/server";

import { sesionAbiertaAConsultas } from "@/lib/portal/calculos";
import { registrarConsulta, sesionesDeMentoria } from "@/lib/portal/datos";
import { LIMITES_CONSULTA, validarConsulta } from "@/lib/portal/validacion-consulta";
import { obtenerSesion } from "@/lib/sesion";

/**
 * Recibe una consulta de mentoría del becario.
 *
 * Primera escritura del portal, así que las reglas quedan sentadas acá:
 *
 * - **Sin sesión no hay POST.** 401 y nada más: este endpoint no existe para
 *   quien no entró.
 * - **La identidad sale de la cookie, nunca del cuerpo.** El becario es el de
 *   la sesión firmada; un campo `becarioId` en el JSON sería una invitación a
 *   escribir consultas a nombre de otro.
 * - **El servidor revalida todo**, aunque el formulario ya haya validado: la
 *   validación del cliente se saltea con la consola abierta. Eso incluye el
 *   cierre de consultas de la sesión elegida — una fecha límite que sólo se
 *   controla en el navegador no es una fecha límite.
 * - **Lo que se guarda es texto plano.** No se interpreta ni se renderiza como
 *   marcado en ningún lado; React lo escapa al mostrarlo.
 */
export async function POST(request: Request) {
  const sesion = await obtenerSesion();
  if (!sesion) {
    return NextResponse.json({ ok: false, mensaje: "Iniciá sesión para consultar." }, { status: 401 });
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

  const { asunto, texto, sesionId } = cuerpo as {
    asunto?: unknown;
    texto?: unknown;
    sesionId?: unknown;
  };

  if (typeof asunto !== "string" || typeof texto !== "string") {
    return NextResponse.json(
      { ok: false, mensaje: "Faltan el asunto o el texto de la consulta." },
      { status: 400 }
    );
  }

  // Techo duro antes de validar fino: nadie necesita mandar medio megabyte, y
  // rechazarlo temprano evita trabajar sobre un cuerpo desmedido.
  if (asunto.length > LIMITES_CONSULTA.asunto.maximo * 2 || texto.length > LIMITES_CONSULTA.texto.maximo * 2) {
    return NextResponse.json({ ok: false, mensaje: "La consulta es demasiado larga." }, { status: 400 });
  }

  const errores = validarConsulta({ asunto, texto });
  if (errores.asunto || errores.texto) {
    return NextResponse.json({ ok: false, errores }, { status: 400 });
  }

  // La sesión de mentoría es opcional; si viene, tiene que existir y aceptar
  // consultas todavía. Esta es la validación que no puede vivir en el cliente.
  let sesionElegida = null;
  if (sesionId !== undefined && sesionId !== null && sesionId !== "") {
    if (typeof sesionId !== "string") {
      return NextResponse.json({ ok: false, mensaje: "La sesión indicada no es válida." }, { status: 400 });
    }
    const sesiones = await sesionesDeMentoria();
    sesionElegida = sesiones.find((s) => s.id === sesionId) ?? null;
    if (!sesionElegida) {
      return NextResponse.json(
        { ok: false, errores: { sesionId: "Esa sesión no existe." } },
        { status: 400 }
      );
    }
    if (!sesionAbiertaAConsultas(sesionElegida)) {
      return NextResponse.json(
        {
          ok: false,
          errores: {
            sesionId:
              "Esa sesión ya no acepta consultas: el cierre pasó o la sesión no está programada. Mandala por el canal abierto."
          }
        },
        { status: 400 }
      );
    }
  }

  const consulta = await registrarConsulta(sesion.becarioId, {
    asunto: asunto.trim(),
    texto: texto.trim(),
    sesionId: sesionElegida?.id ?? null,
    sesion: sesionElegida?.titulo ?? null
  });

  return NextResponse.json({ ok: true, consulta }, { status: 201 });
}
