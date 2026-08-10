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
import { almacen } from "@/lib/almacen";
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
 * Lo que se escribe desde el portal, hasta que exista la base.
 *
 * No es persistencia y la advertencia completa está en
 * [`lib/almacen.ts`](../almacen.ts): un reinicio los vacía y en serverless cada
 * instancia lleva el suyo.
 */
const consultasPorBecario = almacen<Consulta[]>("consultas");
const entregasPorBecario = almacen<Entrega>("entregas");

function consultasEnviadas(becarioId: string): Consulta[] {
  return consultasPorBecario.get(becarioId) ?? [];
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

  const propias = consultasPorBecario.get(becarioId) ?? [];
  consultasPorBecario.set(becarioId, [consulta, ...propias]);

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
  return entregasPorBecario.get(becarioId) ?? null;
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

  entregasPorBecario.set(becarioId, entrega);

  return entrega;
}

/* -------------------------------------------------------------------------- */
/* Lo que ve el comité académico                                              */
/* -------------------------------------------------------------------------- */

/** Una entrega con la identidad de quien la escribió, para el listado. */
export type EntregaDeCohorte = {
  becarioId: string;
  /** `null` mientras no tengamos el nombre: hoy el padrón sólo trae documentos. */
  nombre: string | null;
  entrega: Entrega;
};

/**
 * Todas las entregas de la cohorte, para el comité.
 *
 * ⚠️ **No comprueba permisos.** Quien llame tiene que haber verificado el rol
 * antes; esta función sólo lee. La comprobación vive en las rutas, que es donde
 * se sabe quién está pidiendo.
 *
 * TODO: cuando exista la base es un `select` con join a becarios, ordenado por
 * estado y fecha. Hoy junta el ejemplo con lo que haya en memoria.
 */
export async function entregasDeLaCohorte(): Promise<EntregaDeCohorte[]> {
  const porBecario = new Map<string, EntregaDeCohorte>();

  if (process.env.PORTAL_DATOS_DEMO === "true") {
    for (const fila of entregasDeEjemplo()) porBecario.set(fila.becarioId, fila);
  }

  // Lo guardado de verdad gana sobre el ejemplo: si alguien escribió, es lo suyo.
  for (const [becarioId, entrega] of entregasPorBecario) {
    porBecario.set(becarioId, {
      becarioId,
      nombre: porBecario.get(becarioId)?.nombre ?? null,
      entrega
    });
  }

  // Primero lo que espera respuesta del comité, que es a lo que vienen.
  const prioridad: Record<Entrega["estado"], number> = {
    presentado: 0,
    observado: 1,
    borrador: 2,
    aprobado: 3,
    "sin-empezar": 4
  };

  return [...porBecario.values()].sort(
    (a, b) =>
      prioridad[a.entrega.estado] - prioridad[b.entrega.estado] ||
      (a.nombre ?? a.becarioId).localeCompare(b.nombre ?? b.becarioId, "es")
  );
}

/**
 * Devuelve una entrega con observaciones del comité.
 *
 * Sólo se puede observar algo **presentado**: observar un borrador sería opinar
 * sobre lo que la persona todavía está escribiendo, y observar algo aprobado
 * contradice la aprobación. Devuelve `null` si no corresponde, y la ruta lo
 * traduce a un error.
 */
export async function registrarObservaciones(
  becarioId: string,
  observaciones: string
): Promise<Entrega | null> {
  const actual = entregaGuardada(becarioId) ?? entregaDeEjemploDe(becarioId);
  if (!actual || actual.estado !== "presentado") return null;

  const entrega: Entrega = {
    ...actual,
    estado: "observado",
    observaciones: observaciones.trim()
  };

  entregasPorBecario.set(becarioId, entrega);

  return entrega;
}

/** La entrega de ejemplo de un becario, para poder operar sobre el ejemplo. */
function entregaDeEjemploDe(becarioId: string): Entrega | null {
  if (process.env.PORTAL_DATOS_DEMO !== "true") return null;
  return entregasDeEjemplo().find((f) => f.becarioId === becarioId)?.entrega ?? null;
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

/** A qué eje pertenece cada módulo, para no repetirlo en cada encuentro. */
const EJE_DEL_MODULO: Record<string, string> = {
  "Perfil dirigente": "El Sujeto Político",
  "Lectura del territorio": "El Territorio",
  "La máquina del Estado": "El Estado"
};

function datosDeEjemplo(): DatosDelPortal {
  // El cronograma como tabla: así se lee de un vistazo qué clase cae cuándo y en
  // qué estado, que es lo que hay que poder ajustar al probar. Lo repetido —el
  // aula, la hora de fin, el enlace de los virtuales, el eje— se completa abajo.
  const clases = [
    { id: "e7", dias: -42, titulo: "Masterclass inaugural", modulo: "Perfil dirigente", referente: "Marisol De Ambrosio" },
    { id: "e6", dias: -35, titulo: "Organizaciones sociales y trabajo barrial", modulo: "Lectura del territorio" },
    { id: "e8", dias: -28, titulo: "Toma de decisiones en contextos de conflicto", modulo: "Perfil dirigente" },
    { id: "e1", dias: -21, titulo: "Ética y vocación pública", modulo: "Perfil dirigente" },
    { id: "e2", dias: -14, titulo: "Opinión pública y dinámica del electorado", modulo: "Lectura del territorio", referente: "Diego Reynoso" },
    { id: "e3", dias: -7, titulo: "Narrativa y discurso", modulo: "Perfil dirigente", modalidad: "virtual" },
    { id: "e4", dias: -3, titulo: "Presupuesto municipal", modulo: "La máquina del Estado", estado: "cancelado" },
    { id: "e5", dias: 4, titulo: "Arquitectura institucional del municipio", modulo: "La máquina del Estado", estado: "programado" }
  ] as const;

  const encuentros: Encuentro[] = clases.map((clase) => {
    const modalidad = "modalidad" in clase ? clase.modalidad : "presencial";
    const esVirtual = modalidad === "virtual";
    return {
      id: clase.id,
      titulo: clase.titulo,
      modulo: clase.modulo,
      eje: EJE_DEL_MODULO[clase.modulo]!,
      comienza: diasDesdeHoy(clase.dias),
      termina: diasDesdeHoy(clase.dias, esVirtual ? 20 : 21),
      modalidad,
      estado: "estado" in clase ? clase.estado : "dictado",
      lugar: esVirtual ? null : "Aula magna, UNSTA",
      enlace: esVirtual ? "https://meet.example/elcop" : null,
      // Una masterclass es un encuentro con referente, no una lista aparte.
      esMasterclass: "referente" in clase,
      referente: "referente" in clase ? clase.referente : null
    };
  });

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

  // Con `encuentroId` el material cuelga de una clase; sin él, del módulo entero.
  // Esa es la única distinción que la pantalla necesita mostrar.
  const materiales: Material[] = [
    { id: "m1", titulo: "Ética pública — presentación", tipo: "presentacion", modulo: "Perfil dirigente", encuentroId: "e1", descripcion: "Las diapositivas del encuentro.", archivo: "#" },
    { id: "m2", titulo: "Bibliografía del módulo", tipo: "bibliografia", modulo: "Lectura del territorio", encuentroId: null, descripcion: "Lecturas de todo el módulo, no de una clase puntual.", archivo: "#" },
    { id: "m3", titulo: "Encuestas y sus límites — lectura", tipo: "lectura", modulo: "Lectura del territorio", encuentroId: "e2", descripcion: null, archivo: "#" },
    { id: "m4", titulo: "Toma de decisiones — presentación", tipo: "presentacion", modulo: "Perfil dirigente", encuentroId: "e8", descripcion: null, archivo: "#" },
    { id: "m5", titulo: "Guía de lectura del presupuesto", tipo: "lectura", modulo: "La máquina del Estado", encuentroId: null, descripcion: "Para llegar preparado al próximo encuentro.", archivo: "#" }
  ];

  const sesionesMentoria: SesionMentoria[] = [
    // Las preguntas cierran un día antes, para que quien mentorea llegue con la
    // lista leída. Es lo que hace funcionar el "antes de la sesión".
    { id: "s1", titulo: "Mentoría de proyecto final", mentor: "Camila Giuliano", comienza: diasDesdeHoy(6, 19), cierreDeConsultas: diasDesdeHoy(5, 12), enlace: null, estado: "programada" },
    { id: "s2", titulo: "Mentoría de metodología", mentor: "Rodrigo Gómez Tortosa", comienza: diasDesdeHoy(-8, 19), cierreDeConsultas: diasDesdeHoy(-9, 12), enlace: null, estado: "realizada" }
  ];

  // Una dirigida a una sesión y sin responder; otra del canal abierto y ya
  // respondida: los dos modos y los dos estados que se ven en la pantalla.
  const consultas: Consulta[] = [
    {
      id: "c1",
      asunto: "Dudas sobre el recorte del problema",
      texto: "Mi proyecto abarca todo el transporte público del área metropolitana y me dijeron que es demasiado. ¿Cómo decido qué recortar sin que pierda sentido?",
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
      respuesta: "En la Dirección de Movilidad tienen los registros GPS de las unidades. Escribile a la coordinación y te armamos el contacto.",
      respondidaEn: diasDesdeHoy(-7)
    }
  ];

  // Un borrador a medio escribir: se ve lo que ya está, lo que falta y el aviso
  // de que todavía no está presentado.
  const entrega: Entrega = {
    estado: "borrador",
    titulo: "Red de ciclovías para el microcentro",
    resumen: "Una red de ciclovías protegidas que conecte las cuatro avenidas del microcentro con las terminales de colectivos.",
    secciones: {
      problema: "El microcentro concentra la mayor densidad de viajes diarios y no tiene infraestructura ciclista continua. Quien llega en colectivo a las terminales cubre las últimas cuadras caminando o compartiendo calzada con el tránsito.",
      diagnostico: "Los tramos existentes están desconectados entre sí: terminan en esquinas sin continuidad. Falta el registro de siniestros con ciclistas de los últimos tres años.",
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

  return { encuentros, asistencias, materiales, consultas, sesionesMentoria, entrega, actas, esDemostracion: true };
}

/**
 * Entregas de ejemplo de la cohorte, para mostrar el listado del comité.
 *
 * Hay una por estado: es lo que quien evalúa necesita distinguir de un vistazo, y
 * cinco redacciones distintas no agregarían nada. Por eso las secciones se
 * completan igual para todas y sólo cambian el título y el problema.
 *
 * El primer documento es el del padrón provisorio, así que la entrega que se
 * escribe desde el portal aparece en este listado y el circuito se puede probar
 * de punta a punta con una sola persona.
 */
function entregasDeEjemplo(): EntregaDeCohorte[] {
  const ejemplos = [
    { doc: "30456789", nombre: null, estado: "presentado", dias: -4,
      titulo: "Red de ciclovías para el microcentro",
      problema: "El microcentro concentra la mayor densidad de viajes diarios y no tiene infraestructura ciclista continua." },
    { doc: "28111222", nombre: "Marina Sosa", estado: "presentado", dias: -2,
      titulo: "Puntos verdes con seguimiento de residuos",
      problema: "La ciudad no sabe cuánto residuo se separa en origen porque nunca se midió." },
    { doc: "27333444", nombre: "Julián Pereyra", estado: "observado", dias: -12,
      titulo: "Turnos únicos para trámites municipales",
      problema: "Los trámites están repartidos en seis sistemas de turnos que no se hablan entre sí.",
      observaciones: "El diagnóstico está muy bien, pero el presupuesto no distingue entre lo que ya existe y lo que hay que comprar. Revisalo y volvé a presentar." },
    { doc: "26555666", nombre: "Carla Nieva", estado: "borrador", dias: -1,
      titulo: "Arbolado urbano por cuadra",
      problema: "El arbolado se releva por avenida y no por cuadra, así que los faltantes dentro de los barrios no figuran en ningún registro." },
    { doc: "25777888", nombre: "Rodrigo Salvatierra", estado: "aprobado", dias: -20,
      titulo: "Presupuesto participativo en formato abierto",
      problema: "Los resultados se publican en PDF, así que no se pueden comparar entre años." }
  ] as const;

  return ejemplos.map(({ doc, nombre, estado, dias, titulo, problema, ...resto }) => {
    // Un borrador tiene sólo lo primero escrito: es lo que lo hace reconocible
    // como borrador en el listado, y lo que impide devolverlo.
    const enBorrador = estado === "borrador";

    return {
      becarioId: doc,
      nombre,
      entrega: {
        estado,
        titulo,
        resumen: enBorrador ? null : `${titulo}: una propuesta para la ciudad, con etapas y presupuesto.`,
        secciones: {
          problema,
          diagnostico: enBorrador ? "" : "Relevamiento propio, datos abiertos del municipio y entrevistas con vecinos.",
          propuesta: enBorrador ? "" : `${titulo}, en tres etapas, empezando por una prueba acotada para medir antes de escalar.`,
          presupuesto: enBorrador ? "" : "Dos personas a tiempo parcial durante seis meses, con equipamiento que ya existe en el municipio.",
          viabilidad: enBorrador ? "" : "No requiere ordenanza nueva. El riesgo principal es la coordinación entre áreas."
        },
        presentadoEn: enBorrador ? null : diasDesdeHoy(dias),
        guardadaEn: diasDesdeHoy(dias),
        observaciones: "observaciones" in resto ? resto.observaciones : null
      }
    };
  });
}
