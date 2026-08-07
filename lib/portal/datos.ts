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
import type { Acta, Asistencia, Consulta, DatosDelPortal, Encuentro, Entrega, Material } from "./tipos";

/**
 * Trae todo lo del portal para un becario.
 *
 * TODO: reemplazar por las consultas reales cuando exista la base. Van a ser
 * cinco lecturas —encuentros de la cohorte, asistencias del becario, materiales
 * visibles, sus consultas y su entrega— más las actas.
 */
export async function datosDelPortal(becarioId: string): Promise<DatosDelPortal> {
  if (process.env.PORTAL_DATOS_DEMO === "true") return datosDeEjemplo();

  return {
    encuentros: [],
    asistencias: [],
    materiales: [],
    consultas: [],
    entrega: { estado: "sin-empezar", titulo: null, presentadoEn: null },
    actas: [],
    esDemostracion: false
  };
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
      titulo: "Bibliografía del eje El Territorio",
      tipo: "bibliografia",
      modulo: "Lectura del territorio",
      encuentroId: null,
      descripcion: "Lecturas sugeridas para todo el módulo.",
      archivo: "#"
    }
  ];

  const consultas: Consulta[] = [
    {
      id: "c1",
      asunto: "Dudas sobre el recorte del problema",
      estado: "pendiente",
      creadaEn: diasDesdeHoy(-2),
      sesion: "Mentoría de proyecto final"
    },
    {
      id: "c2",
      asunto: "Fuentes de datos de movilidad",
      estado: "respondida",
      creadaEn: diasDesdeHoy(-9),
      sesion: null
    }
  ];

  const entrega: Entrega = {
    estado: "borrador",
    titulo: "Red de ciclovías para el microcentro",
    presentadoEn: null
  };

  const actas: Acta[] = [
    { id: "a1", tipo: "contrato-beca", titulo: "Contrato de Beca 2026", aceptadaEn: diasDesdeHoy(-30) },
    { id: "a2", tipo: "acta-compromiso", titulo: "Acta Compromiso", aceptadaEn: null }
  ];

  return { encuentros, asistencias, materiales, consultas, entrega, actas, esDemostracion: true };
}
