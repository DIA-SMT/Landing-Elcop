/**
 * De dónde salen los datos del portal.
 *
 * Mismo patrón que `lib/padron.ts`: una función con la forma final, cuyo cuerpo
 * hoy es provisorio. Cuando exista la base, se reemplaza lo de adentro y ni el
 * cálculo ni las pantallas se enteran.
 *
 * ## Dos modos, y la diferencia importa
 *
 * Por defecto el portal aparece **vacío**, que es lo que un becario va a ver de
 * verdad el primer día: todavía no hay clases cargadas ni asistencia tomada.
 * Los estados vacíos no son un descuido, son la primera pantalla real.
 *
 * Con `PORTAL_DATOS_DEMO=true` se muestran datos de ejemplo, para poder enseñar
 * cómo va a verse. En ese caso la interfaz lo dice en pantalla: mostrarle a un
 * becario un 89% de asistencia inventado sería peor que no mostrarle nada.
 */
import type {
  Acta,
  Asistencia,
  Consulta,
  DatosDelPortal,
  Encuentro,
  Entrega,
  EstadoEntrega,
  Material,
  SesionMentoria
} from "./tipos";

/**
 * Trae todo lo del portal para un becario.
 *
 * TODO: reemplazar por las consultas reales cuando exista la base. Van a ser
 * seis lecturas —encuentros de la cohorte, asistencias del becario, materiales
 * visibles, sesiones de mentoría, sus consultas y su entrega— más las actas.
 */
export async function datosDelPortal(becarioId: string): Promise<DatosDelPortal> {
  const enviadas = consultasEnviadas(becarioId);
  const propia = entregaGuardada(becarioId);

  if (process.env.PORTAL_DATOS_DEMO === "true") {
    const datos = datosDeEjemplo();
    return {
      ...datos,
      // Las recién enviadas arriba: es lo que la persona acaba de hacer.
      consultas: [...enviadas, ...datos.consultas],
      // Lo que escribió gana sobre el ejemplo: si ya trabajó, es lo suyo.
      entrega: propia ?? datos.entrega
    };
  }

  return {
    encuentros: [],
    asistencias: [],
    materiales: [],
    consultas: enviadas,
    sesionesMentoria: [],
    entrega: propia ?? entregaVacia(),
    actas: [],
    esDemostracion: false
  };
}

/**
 * Las sesiones de mentoría, para validar en el servidor a cuál se puede
 * mandar una consulta.
 */
export async function sesionesDeMentoria(): Promise<SesionMentoria[]> {
  if (process.env.PORTAL_DATOS_DEMO === "true") return datosDeEjemplo().sesionesMentoria;
  return [];
}

/**
 * Fecha límite para presentar el proyecto final, en ISO, o `null` si no hay.
 *
 * ⚠️ **Hoy devuelve `null` a propósito.** ELCOP todavía no definió la fecha
 * —ítem 22 de `PENDIENTES.md`—, y poner una inventada sería peor: alguien la
 * tomaría por oficial y organizaría su trabajo contra un dato falso. Sin fecha,
 * la interfaz lo dice y el servidor no rechaza nada por vencimiento.
 *
 * TODO: cuando ELCOP la confirme, sale de la configuración de la cohorte.
 */
export async function fechaLimiteEntrega(): Promise<string | null> {
  const configurada = process.env.PORTAL_FECHA_LIMITE_ENTREGA;
  if (configurada && !Number.isNaN(Date.parse(configurada))) {
    return new Date(configurada).toISOString();
  }
  return null;
}

/* -------------------------------------------------------------------------- */
/* Almacén provisorio de consultas                                            */
/* -------------------------------------------------------------------------- */

/**
 * Las consultas que el becario envía se guardan acá hasta que exista la base.
 *
 * ⚠️ **Es memoria del proceso, no persistencia.** Sobrevive mientras viva el
 * servidor; en un despliegue serverless cada instancia tiene la suya y un
 * reinicio la vacía. Alcanza para probar el circuito completo —enviar, ver la
 * consulta en la lista, validar en el servidor— pero ninguna consulta real
 * puede depender de esto.
 *
 * Se cuelga de `globalThis` para sobrevivir a la recompilación en caliente de
 * Next en desarrollo, que reinicia el módulo pero no el proceso.
 */
const almacen = globalThis as unknown as {
  __consultasElcop?: Map<string, Consulta[]>;
  __entregasElcop?: Map<string, Entrega>;
};

function consultasEnviadas(becarioId: string): Consulta[] {
  return almacen.__consultasElcop?.get(becarioId) ?? [];
}

/** Registra una consulta enviada desde el portal. Devuelve la consulta creada. */
export async function registrarConsulta(
  becarioId: string,
  datos: { asunto: string; texto: string; sesionId: string | null; sesion: string | null }
): Promise<Consulta> {
  const consulta: Consulta = {
    id: `enviada-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    asunto: datos.asunto,
    texto: datos.texto,
    estado: "pendiente",
    creadaEn: new Date().toISOString(),
    sesionId: datos.sesionId,
    sesion: datos.sesion,
    respuesta: null,
    respondidaEn: null
  };

  almacen.__consultasElcop ??= new Map();
  const propias = almacen.__consultasElcop.get(becarioId) ?? [];
  almacen.__consultasElcop.set(becarioId, [consulta, ...propias]);

  return consulta;
}

/* -------------------------------------------------------------------------- */
/* Almacén provisorio del proyecto final                                      */
/* -------------------------------------------------------------------------- */

/** Una entrega en blanco: lo que ve alguien que todavía no escribió nada. */
export function entregaVacia(): Entrega {
  return {
    estado: "sin-empezar",
    titulo: null,
    resumen: null,
    secciones: { problema: "", diagnostico: "", propuesta: "", presupuesto: "", viabilidad: "" },
    presentadoEn: null,
    guardadaEn: null,
    observaciones: null
  };
}

/** La entrega guardada del becario, o `null` si nunca guardó. */
export function entregaGuardada(becarioId: string): Entrega | null {
  return almacen.__entregasElcop?.get(becarioId) ?? null;
}

/**
 * En qué estado queda la entrega después de guardar.
 *
 * Presentar siempre deja `presentado`. Guardar un borrador deja `borrador`,
 * incluso si venía presentada: quien vuelve a editar la retiró de hecho, y decir
 * que sigue presentada sería mentir sobre qué va a evaluar el comité.
 *
 * La única excepción es `observado`: ahí el comité ya escribió algo, y ese estado
 * se conserva hasta que la persona vuelva a presentar. `aprobado` no llega acá,
 * porque `entregaAbierta` lo deja afuera antes.
 */
function estadoTrasGuardar(anterior: EstadoEntrega, presentar: boolean): EstadoEntrega {
  if (presentar) return "presentado";
  return anterior === "observado" ? "observado" : "borrador";
}

/**
 * Guarda el proyecto final, como borrador o presentado.
 *
 * ⚠️ **Mismo almacén en memoria que las consultas, y la misma advertencia**: un
 * reinicio lo vacía y en serverless cada instancia tiene el suyo. Acá pesa más
 * que en las consultas, porque lo que se pierde es un trabajo largo. **Antes de
 * que un becario real escriba su proyecto, esto tiene que ser la base.**
 */
export async function guardarEntrega(
  becarioId: string,
  datos: {
    titulo: string;
    resumen: string;
    secciones: Entrega["secciones"];
    presentar: boolean;
  }
): Promise<Entrega> {
  const anterior = entregaGuardada(becarioId);
  const ahora = new Date().toISOString();

  const entrega: Entrega = {
    estado: estadoTrasGuardar(anterior?.estado ?? "sin-empezar", datos.presentar),
    titulo: datos.titulo.trim() || null,
    resumen: datos.resumen.trim() || null,
    secciones: datos.secciones,
    presentadoEn: datos.presentar ? ahora : (anterior?.presentadoEn ?? null),
    guardadaEn: ahora,
    observaciones: anterior?.observaciones ?? null
  };

  almacen.__entregasElcop ??= new Map();
  almacen.__entregasElcop.set(becarioId, entrega);

  return entrega;
}

/* -------------------------------------------------------------------------- */
/* Datos de ejemplo                                                           */
/* -------------------------------------------------------------------------- */

/** Fechas relativas a hoy, para que el ejemplo no envejezca. */
function diasDesdeHoy(dias: number, hora = 18): string {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + dias);
  fecha.setHours(hora, 0, 0, 0);
  return fecha.toISOString();
}

function datosDeEjemplo(): DatosDelPortal {
  const encuentros: Encuentro[] = [
    {
      id: "e1",
      titulo: "Ética y vocación pública",
      modulo: "Perfil dirigente",
      eje: "El Sujeto Político",
      comienza: diasDesdeHoy(-21),
      termina: diasDesdeHoy(-21, 21),
      modalidad: "presencial",
      estado: "dictado",
      lugar: "Aula magna, UNSTA",
      enlace: null,
      esMasterclass: false,
      referente: null
    },
    {
      id: "e2",
      titulo: "Opinión pública y dinámica del electorado",
      modulo: "Lectura del territorio",
      eje: "El Territorio",
      comienza: diasDesdeHoy(-14),
      termina: diasDesdeHoy(-14, 21),
      modalidad: "presencial",
      estado: "dictado",
      lugar: "Aula magna, UNSTA",
      enlace: null,
      esMasterclass: true,
      referente: "Diego Reynoso"
    },
    {
      id: "e3",
      titulo: "Narrativa y discurso",
      modulo: "Perfil dirigente",
      eje: "El Sujeto Político",
      comienza: diasDesdeHoy(-7),
      termina: diasDesdeHoy(-7, 20),
      modalidad: "virtual",
      estado: "dictado",
      lugar: null,
      enlace: "https://meet.example/elcop",
      esMasterclass: false,
      referente: null
    },
    {
      id: "e4",
      titulo: "Presupuesto municipal",
      modulo: "La máquina del Estado",
      eje: "El Estado",
      comienza: diasDesdeHoy(-3),
      termina: diasDesdeHoy(-3, 21),
      modalidad: "presencial",
      estado: "cancelado",
      lugar: "Aula magna, UNSTA",
      enlace: null,
      esMasterclass: false,
      referente: null
    },
    {
      id: "e5",
      titulo: "Arquitectura institucional del municipio",
      modulo: "La máquina del Estado",
      eje: "El Estado",
      comienza: diasDesdeHoy(4),
      termina: diasDesdeHoy(4, 21),
      modalidad: "presencial",
      estado: "programado",
      lugar: "Aula magna, UNSTA",
      enlace: null,
      esMasterclass: false,
      referente: null
    },
    {
      id: "e6",
      titulo: "Organizaciones sociales y trabajo barrial",
      modulo: "Lectura del territorio",
      eje: "El Territorio",
      comienza: diasDesdeHoy(-35),
      termina: diasDesdeHoy(-35, 21),
      modalidad: "presencial",
      estado: "dictado",
      lugar: "Aula magna, UNSTA",
      enlace: null,
      esMasterclass: false,
      referente: null
    },
    {
      id: "e7",
      titulo: "Masterclass inaugural",
      modulo: "Perfil dirigente",
      eje: "El Sujeto Político",
      comienza: diasDesdeHoy(-42),
      termina: diasDesdeHoy(-42, 21),
      modalidad: "presencial",
      estado: "dictado",
      lugar: "Aula magna, UNSTA",
      enlace: null,
      esMasterclass: true,
      referente: "Marisol De Ambrosio"
    },
    {
      id: "e8",
      titulo: "Toma de decisiones en contextos de conflicto",
      modulo: "Perfil dirigente",
      eje: "El Sujeto Político",
      comienza: diasDesdeHoy(-28),
      termina: diasDesdeHoy(-28, 21),
      modalidad: "presencial",
      estado: "dictado",
      lugar: "Aula magna, UNSTA",
      enlace: null,
      esMasterclass: false,
      referente: null
    }
  ];

  // Cinco presenciales dictados, presente en cuatro: 80%, por encima del piso.
  // El virtual (e3) no computa y el cancelado (e4) sale del denominador.
  // Para ver el aviso de irregularidad, cambiar otra a "ausente".
  const asistencias: Asistencia[] = [
    { encuentroId: "e7", estado: "presente", origen: "qr", registradaEn: diasDesdeHoy(-42, 18) },
    { encuentroId: "e6", estado: "presente", origen: "qr", registradaEn: diasDesdeHoy(-35, 18) },
    { encuentroId: "e8", estado: "presente", origen: "qr", registradaEn: diasDesdeHoy(-28, 18) },
    { encuentroId: "e1", estado: "presente", origen: "qr", registradaEn: diasDesdeHoy(-21, 18) },
    { encuentroId: "e2", estado: "ausente", origen: "manual", registradaEn: diasDesdeHoy(-14, 22) }
  ];

  const materiales: Material[] = [
    {
      id: "m1",
      titulo: "Ética pública — presentación",
      tipo: "presentacion",
      modulo: "Perfil dirigente",
      encuentroId: "e1",
      descripcion: "Las diapositivas del encuentro.",
      archivo: "#"
    },
    {
      id: "m2",
      titulo: "Bibliografía del módulo",
      tipo: "bibliografia",
      modulo: "Lectura del territorio",
      encuentroId: null,
      descripcion: "Lecturas sugeridas para todo el módulo, no para una clase puntual.",
      archivo: "#"
    },
    {
      id: "m3",
      titulo: "Encuestas y sus límites — lectura",
      tipo: "lectura",
      modulo: "Lectura del territorio",
      encuentroId: "e2",
      descripcion: null,
      archivo: "#"
    },
    {
      id: "m4",
      titulo: "Datos de opinión pública — planilla",
      tipo: "otro",
      modulo: "Lectura del territorio",
      encuentroId: "e2",
      descripcion: "La base que se usó en la clase.",
      archivo: "#"
    },
    {
      id: "m5",
      titulo: "Toma de decisiones — presentación",
      tipo: "presentacion",
      modulo: "Perfil dirigente",
      encuentroId: "e8",
      descripcion: null,
      archivo: "#"
    },
    {
      id: "m6",
      titulo: "Guía de lectura del presupuesto",
      tipo: "lectura",
      modulo: "La máquina del Estado",
      encuentroId: null,
      descripcion: "Para llegar preparado al próximo encuentro.",
      archivo: "#"
    }
  ];

  const sesionesMentoria: SesionMentoria[] = [
    {
      id: "s1",
      titulo: "Mentoría de proyecto final",
      mentor: "Camila Giuliano",
      comienza: diasDesdeHoy(6, 19),
      // Las preguntas cierran un día antes, para que quien mentorea llegue
      // con la lista leída.
      cierreDeConsultas: diasDesdeHoy(5, 12),
      enlace: null,
      estado: "programada"
    },
    {
      id: "s2",
      titulo: "Mentoría de metodología",
      mentor: "Rodrigo Gómez Tortosa",
      comienza: diasDesdeHoy(-8, 19),
      cierreDeConsultas: diasDesdeHoy(-9, 12),
      enlace: null,
      estado: "realizada"
    }
  ];

  const consultas: Consulta[] = [
    {
      id: "c1",
      asunto: "Dudas sobre el recorte del problema",
      texto:
        "Mi proyecto abarca todo el transporte público del área metropolitana y me dijeron que es demasiado. ¿Cómo decido qué recortar sin que pierda sentido?",
      estado: "pendiente",
      creadaEn: diasDesdeHoy(-2),
      sesionId: "s1",
      sesion: "Mentoría de proyecto final",
      respuesta: null,
      respondidaEn: null
    },
    {
      id: "c2",
      asunto: "Fuentes de datos de movilidad",
      texto: "¿Dónde consigo datos de frecuencia de colectivos de la ciudad?",
      estado: "respondida",
      creadaEn: diasDesdeHoy(-9),
      sesionId: null,
      sesion: null,
      respuesta:
        "En la Dirección de Movilidad tienen los registros GPS de las unidades. Escribile a la coordinación y te armamos el contacto. Para lo público, el portal de datos del municipio tiene los recorridos actualizados.",
      respondidaEn: diasDesdeHoy(-7)
    }
  ];

  // Un borrador a medio escribir, que es el estado más útil para mostrar: se ve
  // lo que ya está, lo que falta y el aviso de que todavía no está presentado.
  const entrega: Entrega = {
    estado: "borrador",
    titulo: "Red de ciclovías para el microcentro",
    resumen:
      "Una red de ciclovías protegidas que conecte las cuatro avenidas del microcentro con las terminales de colectivos, para que el tramo final de un viaje en transporte público se pueda hacer en bicicleta sin compartir calzada con el tránsito vehicular.",
    secciones: {
      problema:
        "El microcentro concentra la mayor densidad de viajes diarios de la ciudad y no tiene infraestructura ciclista continua. Quien llega en colectivo a las terminales y necesita cubrir los últimos quince cuadras lo hace caminando o compartiendo calzada con el tránsito, que en hora pico circula sobre los 40 km/h. Afecta sobre todo a quienes trabajan en el centro y viven en la periferia.",
      diagnostico:
        "Los tramos de ciclovía existentes están desconectados entre sí: terminan en esquinas sin continuidad. Falta relevamiento propio de conteos por hora y del registro de siniestros con ciclistas de los últimos tres años, que hay que pedir a la Dirección de Movilidad.",
      propuesta: "",
      presupuesto: "",
      viabilidad: ""
    },
    presentadoEn: null,
    guardadaEn: diasDesdeHoy(-3),
    observaciones: null
  };

  const actas: Acta[] = [
    { id: "a1", tipo: "contrato-beca", titulo: "Contrato de Beca 2026", aceptadaEn: diasDesdeHoy(-30) },
    { id: "a2", tipo: "acta-compromiso", titulo: "Acta Compromiso", aceptadaEn: null }
  ];

  return {
    encuentros,
    asistencias,
    materiales,
    consultas,
    sesionesMentoria,
    entrega,
    actas,
    esDemostracion: true
  };
}
