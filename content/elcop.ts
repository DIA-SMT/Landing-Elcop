/**
 * Fuente única de verdad del contenido público de ELCOP.
 *
 * Todo lo que se lee en la landing sale de acá: actualizar una fecha, sumar un
 * docente o cambiar un texto es editar un objeto de este archivo, no cazar
 * strings por los componentes.
 *
 * Convención del proyecto: cualquier dato provisorio, estimado o de ejemplo va
 * marcado con `// TODO: confirmar con ELCOP` en la línea que lo define. Ningún
 * dato de demostración puede presentarse en la interfaz como dato oficial.
 *
 * El listado completo de lo que falta está en PENDIENTES.md, en la raíz.
 */

/* -------------------------------------------------------------------------- */
/* Tipos                                                                      */
/* -------------------------------------------------------------------------- */

export type ItemNavegacion = {
  etiqueta: string;
  href: string;
  /** Los anclajes viven dentro de la home; las rutas propias son páginas. */
  tipo: "ancla" | "ruta";
};

export type Indicador = {
  id: string;
  valor: number;
  sufijo?: string;
  etiqueta: string;
  detalle: string;
};

export type IntegranteEquipo = {
  nombre: string;
  /** Tratamiento o título que precede al nombre (Dra., Mg., Sr.). */
  tratamiento: string;
  /** Ruta a la foto. `null` mientras no haya imagen real: se usan iniciales. */
  foto: string | null;
};

export type GrupoEquipo = {
  id: string;
  titulo: string;
  descripcion: string;
  integrantes: IntegranteEquipo[];
};

export type EjeFormativo = {
  numero: number;
  titulo: string;
  descripcion: string;
  /** Temas del eje. Provisorios hasta que ELCOP confirme el programa. */
  temas: string[];
};

export type Referente = {
  nombre: string;
  credencial: string;
  tema: string;
};

export type EtapaInscripcion = {
  numero: number;
  titulo: string;
  descripcion: string;
};

export type PreguntaFrecuente = {
  id: string;
  pregunta: string;
  respuesta: string;
};

export type Publicacion = {
  slug: string;
  titulo: string;
  bajada: string;
  /** ISO 8601. Se formatea en el componente con `Intl.DateTimeFormat`. */
  fecha: string;
  categoria: string;
  imagen: string;
  /** Texto alternativo de la portada. */
  imagenAlt: string;
  /** Marca de ejemplo: se muestra en la interfaz para no pasarla por oficial. */
  esEjemplo: boolean;
};

export type CampoFormulario = {
  id: string;
  etiqueta: string;
  tipo: "text" | "email" | "tel" | "date" | "select" | "textarea";
  requerido: boolean;
  placeholder?: string;
  ayuda?: string;
  autoComplete?: string;
  /** Sólo para `select`. */
  opciones?: string[];
  /** Sólo para `textarea`. */
  maximoCaracteres?: number;
};

/* -------------------------------------------------------------------------- */
/* Institución                                                                */
/* -------------------------------------------------------------------------- */

export const ESCUELA = {
  nombreCorto: "ELCOP",
  nombre: "Escuela de Liderazgo y Comunicación Política",
  socios: "Municipalidad de San Miguel de Tucumán · UNSTA",
  cohorte: "Cohorte 2026"
} as const;

/**
 * Franja institucional que corre arriba de todo, por encima del header.
 *
 * Es el patrón habitual de los sitios de gobierno: deja claro de qué
 * institución depende la iniciativa sin competir con la marca de ELCOP, que
 * sigue siendo la que manda en el header.
 *
 * El logo va en su versión blanca porque el fondo es `municipal-900`.
 */
export const FRANJA_INSTITUCIONAL = {
  institucion: "Municipalidad de San Miguel de Tucumán",
  // En pantallas angostas no entra el nombre completo.
  institucionCorta: "Municipalidad de SMT",
  logo: { src: "/logo-ciudad-smt-blanco.png", ancho: 507, alto: 206 },
  sitio: { etiqueta: "smt.gob.ar", href: "https://smt.gob.ar" }
} as const;

/**
 * Crédito de desarrollo, al pie de todo.
 *
 * Va deliberadamente más discreto que el co-branding de SMT y UNSTA: ellas son
 * las instituciones que respaldan la Escuela, la Dirección es quien construyó
 * el sitio. No es la misma jerarquía.
 */
export const DESARROLLO = {
  etiqueta: "Creado por",
  nombre: "Dirección de Inteligencia Artificial",
  organismo: "Municipalidad de San Miguel de Tucumán",
  logo: { src: "/logo-direccion-ia.png", ancho: 526, alto: 220 },
  // TODO: confirmar si la Dirección tiene una página propia a la que enlazar.
  href: null as string | null
} as const;

export const NAVEGACION: ItemNavegacion[] = [
  { etiqueta: "Inicio", href: "/#inicio", tipo: "ancla" },
  { etiqueta: "Institucional", href: "/#institucional", tipo: "ancla" },
  { etiqueta: "Formación", href: "/#formacion", tipo: "ancla" },
  { etiqueta: "Inscripciones", href: "/#inscripciones", tipo: "ancla" },
  { etiqueta: "Publicaciones", href: "/publicaciones", tipo: "ruta" },
  { etiqueta: "Portal del Becario", href: "/portal", tipo: "ruta" }
];

export const HERO = {
  eyebrow: "Municipalidad de SMT + UNSTA",
  titulo: "Formando a los líderes que transforman San Miguel de Tucumán",
  bajada:
    "La Escuela de Liderazgo y Comunicación Política une la academia con el propósito cívico para capacitar a la próxima generación de dirigentes.",
  ctaPrimario: { etiqueta: "Postulate", href: "#postulacion" },
  ctaSecundario: { etiqueta: "Conocé la diplomatura", href: "#formacion" }
} as const;

export type VideoHero = {
  id: string;
  mp4: string;
  /** Fotograma fijo. Es lo único que se ve en celulares. */
  portada: string;
  descripcion: string;
};

/**
 * Videos de fondo del hero.
 *
 * Son animaciones generadas a partir de fotos reales de la cohorte 2026. Van
 * debajo de un velo blanco y se cruzan entre sí con una disolvencia de 1,4
 * segundos.
 *
 * No se descargan en celulares ni con movimiento reducido ni con el ahorro de
 * datos activado: en esos casos se ve sólo la portada del primero.
 *
 * ⚠ Acá había un tercer video, `hero-unsta.mp4` (el telón institucional), y se
 * sacó el 12/8/2026: el generador deformó el sello de la UNSTA —donde va el
 * lema se leen letras inventadas— y al bajar el velo del hero al 16% del lado
 * derecho quedó a la vista. Los archivos siguen en `public/video/` por si se
 * regenera bien; **no volver a listarlo sin verificar el sello con zoom**
 * (ítem 24 de PENDIENTES.md).
 */
export const VIDEOS_HERO: VideoHero[] = [
  {
    id: "hero-clase",
    mp4: "/video/hero-clase.mp4",
    portada: "/video/hero-clase.jpg",
    descripcion: "Clase en el aula magna de la UNSTA"
  },
  {
    id: "hero-grupo",
    mp4: "/video/hero-grupo.mp4",
    portada: "/video/hero-grupo.jpg",
    descripcion: "Foto grupal de la cohorte"
  }
];

export const INDICADORES: Indicador[] = [
  {
    id: "postulantes",
    valor: 1091,
    etiqueta: "Postulantes",
    detalle: "En la primera convocatoria"
  },
  {
    id: "seleccionados",
    valor: 80,
    etiqueta: "Seleccionados",
    detalle: "Cupo de la cohorte 2026"
  },
  {
    id: "beca",
    valor: 100,
    sufijo: "%",
    etiqueta: "Beca",
    detalle: "Sin costo para los seleccionados"
  },
  {
    id: "duracion",
    valor: 4,
    etiqueta: "Meses de cursada",
    detalle: "Presencial + virtual sincronizada"
  }
];

export const INSTITUCIONAL = {
  kicker: "Institucional",
  titulo: "¿Quiénes somos?",
  parrafos: [
    "La Escuela de Liderazgo y Comunicación Política es una plataforma de formación estratégica nacida del convenio marco entre la Municipalidad de San Miguel de Tucumán (SMT) y la Universidad del Norte Santo Tomás de Aquino (UNSTA).",
    "Esta alianza busca cerrar la brecha entre la excelencia académica y la gestión territorial, ofreciendo un espacio de alto nivel donde la teoría y la práctica pública convergen. Nuestra misión es potenciar a los cuadros técnicos y políticos del NOA, dotándolos de herramientas narrativas y metodologías de gestión para liderar con propósito."
  ],
  // TODO: confirmar con ELCOP — falta el PDF real de la carpeta institucional.
  // Mientras no exista el archivo en public/institucional/, el botón queda
  // deshabilitado en la interfaz en vez de llevar a un 404.
  carpeta: {
    etiqueta: "Descargá nuestra carpeta institucional",
    href: "/institucional/carpeta.pdf",
    disponible: false
  },
  foto: {
    src: "/fotos/unsta-fachada.jpg",
    alt: "Fachada de la UNSTA en San Miguel de Tucumán",
    ancho: 1280,
    alto: 854
  }
} as const;

export const EQUIPO: GrupoEquipo[] = [
  {
    id: "direccion",
    titulo: "Dirección",
    descripcion: "Conducción institucional de la Escuela.",
    integrantes: [
      // TODO: confirmar con ELCOP — faltan las fotos del equipo.
      { tratamiento: "Dra.", nombre: "Rossana Chahla", foto: null },
      { tratamiento: "Mg. Ing.", nombre: "José Federico Fanjul", foto: null }
    ]
  },
  {
    id: "coordinacion-academica",
    titulo: "Coordinación Académica",
    descripcion: "Diseño curricular y seguimiento pedagógico de la diplomatura.",
    integrantes: [
      { tratamiento: "Mg.", nombre: "Camila Giuliano", foto: null },
      { tratamiento: "Dr.", nombre: "Rodrigo Gómez Tortosa", foto: null },
      { tratamiento: "Dr.", nombre: "Luigi Pisoni", foto: null }
    ]
  },
  {
    id: "coordinacion-administrativa",
    titulo: "Coordinación Administrativa",
    descripcion: "Gestión de la cursada, inscripciones y vínculo con los becarios.",
    integrantes: [
      { tratamiento: "Srta.", nombre: "Candelaria Fonts", foto: null },
      { tratamiento: "Sr.", nombre: "Félix Agustín Paz", foto: null }
    ]
  }
];

/* -------------------------------------------------------------------------- */
/* Formación                                                                  */
/* -------------------------------------------------------------------------- */

export const DIPLOMATURA = {
  kicker: "Formación",
  titulo: "Diplomatura en Liderazgo y Comunicación Política",
  bajada:
    "Cuatro meses que se recorren en orden: del mensaje y la identidad pública al proyecto de política pública que se presenta y se defiende.",
  // Fuente de verdad: documento oficial de ELCOP (4 meses, 4 ejes).
  // La prensa publicó 5 meses y 2 trayectos. Ver PENDIENTES.md.
  duracion: "4 meses",
  modalidad: "Mixta: presencial + virtual sincronizada"
} as const;

/**
 * Los cuatro ejes de la diplomatura.
 *
 * El programa REAL de la cohorte 2026, del documento oficial "Calendarización
 * para la web" que ELCOP entregó en agosto de 2026 (el mismo que alimenta
 * `lib/portal/calendario.ts`). Los propósitos de los tres módulos son texto del
 * documento; los temas salen de las clases efectivamente dictadas. El cuarto
 * bloque es el mes de proyecto final, que el documento no detalla porque no
 * tiene clases: su descripción sale del propio documento de la diplomatura.
 */
export const EJES: EjeFormativo[] = [
  {
    numero: 1,
    titulo: "El Sujeto Político y la Estrategia del Mensaje",
    descripcion:
      "Construir la identidad pública. Antes de salir a la gestión o al territorio, el dirigente debe entender cómo se diagnostica una política pública, cómo se analiza el contexto de opinión y cómo se articula una narrativa convincente.",
    temas: ["Políticas públicas", "Nuevos medios de comunicación", "Estrategia de comunicación política e institucional", "Storytelling", "Análisis de opinión pública"]
  },
  {
    numero: 2,
    titulo: "Herramientas Institucionales y Acción Comunitaria",
    descripcion:
      "Anclar al becario en la realidad social e institucional local. Del mensaje a la institución y al territorio: el marco normativo y económico, conectado con la capacidad técnica de hablar en público.",
    temas: ["Gestión comunitaria y ONGs", "Derecho constitucional", "Economía local", "Práctica de oratoria", "Liderazgo parlamentario"]
  },
  {
    numero: 3,
    titulo: "Agendas Complejas, Negociación y Exposición",
    descripcion:
      "Ampliar la mirada hacia los grandes debates del presente: la ciudad sustentable, el liderazgo juvenil, la negociación internacional y la exposición ante los medios.",
    temas: ["Construcción de comunidad", "Agenda verde", "Negociación y construcción democrática", "Entrenamiento de medios", "Transporte y logística"]
  },
  {
    numero: 4,
    titulo: "Proyecto de Política Pública Innovadora",
    descripcion:
      "El cuarto mes no tiene clases: cada becario elabora y defiende su Proyecto de Política Pública Innovadora para San Miguel de Tucumán, con el acompañamiento de las mentorías.",
    temas: ["Formulación del proyecto", "Mentorías", "Defensa ante el comité académico"]
  }
];

export const REFERENTES: Referente[] = [
  {
    nombre: "Marisol De Ambrosio",
    credencial: "Estratega en comunicación social y política digital",
    tema: "Masterclass inaugural"
  },
  // Los temas que siguen están confirmados por el calendario oficial de la
  // cohorte 2026 ("Calendarización para la web"): son los plenarios dictados.
  {
    nombre: "Diego Reynoso",
    credencial: "Investigador CONICET · Dr. FLACSO-México",
    tema: "Análisis de opinión pública"
  },
  {
    nombre: "Elisabeth Möhle",
    credencial: "Fundar · Ciencias ambientales",
    tema: "La agenda verde: ciudad sustentable y calidad de vida"
  },
  {
    nombre: "Julieta Daffonchio",
    credencial: "Politóloga · Movilidad urbana",
    tema: "Transporte y logística"
  },
  {
    nombre: "Pablo Pérez Paladino",
    credencial: "Asociación Argentina de Consultores Políticos",
    tema: "Nuevos medios de comunicación en la política"
  },
  {
    nombre: "Malena Dip",
    credencial: "Comunicación digital",
    tema: "Nuevos medios de comunicación en la política"
  },
  {
    nombre: "Laureano Bielsa",
    credencial: "Abogado especializado en finanzas",
    tema: "Nuevos medios de comunicación en la política"
  }
];

/* -------------------------------------------------------------------------- */
/* Inscripciones                                                              */
/* -------------------------------------------------------------------------- */

export const INSCRIPCIONES = {
  kicker: "Inscripciones",
  titulo: "Cómo se ingresa a la Escuela",
  // La frase oficial del documento de ELCOP es una sola, larga. Se parte en dos
  // para que el titular siga pegando: la primera mitad entra como bajada y la
  // segunda como titular. El texto es textual y el corte cae en la coma.
  becaIntro: "Con el objetivo de promover el talento y la excelencia en la función pública,",
  beca:
    "la Municipalidad de SMT y la UNSTA otorgan una Beca del 100% para todos los seleccionados.",
  // Encadena cupos con proceso, como en el documento oficial.
  etapasIntro:
    "Debido a que los cupos son limitados, el proceso de selección consta de dos etapas obligatorias.",
  etapas: [
    {
      numero: 1,
      titulo: "Postulación",
      descripcion:
        "Formulario de antecedentes y motivación. Es la instancia donde contás tu trayectoria y por qué querés formar parte de la Escuela."
    },
    {
      numero: 2,
      titulo: "Entrevista de Admisión",
      descripcion:
        "Encuentro individual con el comité académico para evaluar perfil y compromiso. Ambas etapas son obligatorias."
    }
  ] as EtapaInscripcion[],
  cursada: {
    duracion: "4 meses de cursada",
    modalidad: "Modalidad mixta: presencial + virtual sincronizada",
    modalidadDetalle:
      "Permite un aprendizaje flexible, pero con fuerte anclaje en el networking presencial.",
    asistencia: "75% de asistencia para mantener la regularidad"
  },
  evaluacionFinal: {
    titulo: "Proyecto de Política Pública Innovadora",
    descripcion:
      "La evaluación final no es un examen tradicional: es una competencia de impacto real. Cada participante presenta un Proyecto de Política Pública Innovadora para la ciudad de San Miguel de Tucumán."
  },
  cupos: "Cupos limitados: la cohorte cierra al completar las vacantes disponibles.",
  // TODO: confirmar con ELCOP — no hay fechas de la próxima cohorte.
  proximaCohorte: null as string | null
} as const;

export const FORMULARIO: { campos: CampoFormulario[] } = {
  campos: [
    {
      id: "nombre",
      etiqueta: "Nombre y apellido",
      tipo: "text",
      requerido: true,
      placeholder: "Como figura en tu DNI",
      autoComplete: "name"
    },
    { id: "dni", etiqueta: "DNI", tipo: "text", requerido: true, placeholder: "Sin puntos" },
    { id: "nacimiento", etiqueta: "Fecha de nacimiento", tipo: "date", requerido: true, autoComplete: "bday" },
    {
      id: "email",
      etiqueta: "Email",
      tipo: "email",
      requerido: true,
      placeholder: "nombre@ejemplo.com",
      autoComplete: "email"
    },
    {
      id: "telefono",
      etiqueta: "Teléfono",
      tipo: "tel",
      requerido: true,
      placeholder: "381 000 0000",
      autoComplete: "tel"
    },
    {
      id: "localidad",
      etiqueta: "Localidad",
      tipo: "text",
      requerido: true,
      placeholder: "San Miguel de Tucumán",
      autoComplete: "address-level2"
    },
    {
      id: "ocupacion",
      etiqueta: "Ocupación / espacio de pertenencia",
      tipo: "text",
      requerido: true,
      placeholder: "Organización, institución o actividad"
    },
    {
      id: "nivelEducativo",
      etiqueta: "Nivel educativo",
      tipo: "select",
      requerido: true,
      opciones: [
        "Secundario en curso",
        "Secundario completo",
        "Terciario en curso",
        "Terciario completo",
        "Universitario en curso",
        "Universitario completo",
        "Posgrado"
      ]
    },
    {
      id: "motivacion",
      etiqueta: "¿Por qué querés formar parte de ELCOP?",
      tipo: "textarea",
      requerido: true,
      ayuda: "Contanos tu motivación y qué problema de la ciudad te gustaría trabajar.",
      maximoCaracteres: 1000
    }
  ]
};

export const FAQ: PreguntaFrecuente[] = [
  {
    id: "costo",
    pregunta: "¿Tiene costo?",
    respuesta:
      "No. La Municipalidad de San Miguel de Tucumán y la UNSTA otorgan una beca del 100% a todas las personas seleccionadas: la cursada no tiene arancel ni matrícula."
  },
  {
    id: "titulo",
    pregunta: "¿Necesito título universitario?",
    respuesta:
      "No es un requisito excluyente. La Escuela evalúa trayectoria, motivación y compromiso con lo público; el nivel educativo se declara en la postulación y se conversa en la entrevista de admisión."
  },
  {
    id: "modalidad",
    pregunta: "¿Es presencial o virtual?",
    respuesta:
      "Es mixta. Combina encuentros presenciales en la sede de la UNSTA con clases virtuales sincronizadas, es decir, en vivo y con horario fijo."
  },
  {
    id: "asistencia",
    pregunta: "¿Qué pasa si falto a una clase?",
    respuesta:
      "Se exige un 75% de asistencia para mantener la regularidad. Podés faltar hasta un cuarto de los encuentros; por debajo de ese piso se pierde la condición de alumno regular."
  },
  {
    id: "certificado",
    pregunta: "¿Qué certificado recibo?",
    respuesta:
      // TODO: confirmar con ELCOP — falta el detalle formal de la certificación.
      "Quienes cumplan con la asistencia y presenten el Proyecto de Política Pública Innovadora reciben la certificación de la Diplomatura en Liderazgo y Comunicación Política, emitida en el marco del convenio entre la Municipalidad de SMT y la UNSTA."
  },
  {
    id: "proxima-cohorte",
    pregunta: "¿Cuándo abre la próxima cohorte?",
    respuesta:
      // TODO: confirmar con ELCOP — no hay fechas confirmadas de la próxima cohorte.
      "Todavía no hay fecha confirmada. Dejá tu postulación y te avisamos por email en cuanto se abra la convocatoria."
  }
];

/* -------------------------------------------------------------------------- */
/* Publicaciones                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Crónicas de los plenarios dictados en la cohorte 2026. Fechas, temas e
 * invitados salen del calendario oficial ("Calendarización para la web", el
 * mismo documento que alimenta `lib/portal/calendario.ts`): nada está
 * inventado, y por eso ya no llevan la marca de ejemplo.
 *
 * Las bajadas se limitan a lo que el documento respalda —quién dictó qué y
 * cuándo— sin atribuir citas ni contenidos que no nos consten.
 *
 * Las portadas son fotos reales de la cohorte 2026, pero no sabemos a qué
 * encuentro corresponde cada una: el texto alternativo describe lo que se ve
 * y nada más, y la foto acompaña sin afirmar que sea de esa clase.
 */
export const PUBLICACIONES: Publicacion[] = [
  {
    slug: "plenario-agenda-verde",
    titulo: "La agenda verde: ciudad sustentable y calidad de vida",
    bajada:
      "Elisabeth Möhle, de Fundar, encabezó el sexto plenario de la cohorte, dedicado a la sustentabilidad y la calidad de vida en la ciudad.",
    fecha: "2026-07-04",
    categoria: "Plenario",
    imagen: "/fotos/cohorte-grupo.jpg",
    imagenAlt: "Foto grupal de los becarios de la cohorte 2026 en la UNSTA",
    esEjemplo: false
  },
  {
    slug: "plenario-analisis-opinion-publica",
    titulo: "Análisis de opinión pública, con Diego Reynoso",
    bajada:
      "El investigador del CONICET y doctor por FLACSO-México dictó el segundo plenario de la cohorte, dedicado al análisis de la opinión pública.",
    fecha: "2026-05-30",
    categoria: "Plenario",
    imagen: "/fotos/masterclass-datos.jpg",
    imagenAlt:
      "Clase de la cohorte 2026 con una presentación de datos de opinión pública proyectada",
    esEjemplo: false
  },
  {
    slug: "plenario-nuevos-medios",
    titulo: "Nuevos medios de comunicación en la política",
    bajada:
      "Pablo Pérez Paladino, Malena Dip y Laureano Bielsa compartieron el primer plenario de la cohorte 2026, sobre los nuevos medios en la comunicación política.",
    fecha: "2026-05-16",
    categoria: "Plenario",
    imagen: "/fotos/masterclass-aula.jpg",
    imagenAlt: "Encuentro de la cohorte 2026 en el aula magna de la UNSTA",
    esEjemplo: false
  }
];

/* -------------------------------------------------------------------------- */
/* Contacto y pie                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Datos de contacto institucional.
 *
 * La dirección está confirmada. El resto todavía no: mientras `email` y
 * `telefono` sean `null`, el pie directamente los omite — mostrar "A confirmar"
 * en el sitio publicado sólo contaba que estaba incompleto. El asistente del
 * chat sigue sabiendo que faltan (los detecta `datosQueFaltan`).
 */
export const CONTACTO = {
  direccion: {
    institucion: "UNSTA",
    calle: "9 de Julio 165",
    ciudad: "San Miguel de Tucumán",
    // Enlace al mapa por búsqueda de dirección, sin datos personales en la URL.
    mapa: "https://www.google.com/maps/search/?api=1&query=UNSTA+9+de+Julio+165+San+Miguel+de+Tucum%C3%A1n"
  },
  // TODO: confirmar con ELCOP — falta el mail institucional.
  email: null as string | null,
  // TODO: confirmar con ELCOP — falta el teléfono institucional.
  telefono: null as string | null
} as const;

export type RedSocial = { nombre: string; href: string | null };

// TODO: confirmar con ELCOP — faltan las cuentas oficiales de la Escuela.
export const REDES: RedSocial[] = [
  { nombre: "Instagram", href: null },
  { nombre: "LinkedIn", href: null },
  { nombre: "YouTube", href: null }
];

export const CO_BRANDING = [
  {
    nombre: "Ciudad SMT",
    alt: "Municipalidad de San Miguel de Tucumán",
    // TODO: reemplazar por el logo vectorial (SVG) oficial.
    src: "/logo-ciudad-smt.png",
    ancho: 193,
    alto: 85,
    href: "https://smt.gob.ar"
  },
  {
    nombre: "UNSTA",
    alt: "Universidad del Norte Santo Tomás de Aquino",
    // TODO: reemplazar por el logo vectorial (SVG) oficial.
    src: "/logo-unsta.png",
    ancho: 305,
    alto: 95,
    href: "https://www.unsta.edu.ar"
  }
] as const;

/* -------------------------------------------------------------------------- */
/* Utilidades de presentación                                                 */
/* -------------------------------------------------------------------------- */

/** Formatea un entero con separador de miles argentino: 1091 → "1.091". */
export function formatearNumero(valor: number): string {
  return new Intl.NumberFormat("es-AR").format(valor);
}

/** Formatea una fecha ISO a texto largo: "2026-03-18" → "18 de marzo de 2026". */
export function formatearFecha(iso: string): string {
  // Se construye en UTC para que no se corra un día según la zona horaria.
  const [anio, mes, dia] = iso.split("-").map(Number);
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC"
  }).format(fecha);
}

/**
 * Un rango de fechas legible: "14 y 15 de mayo de 2026".
 *
 * Existe por las clases de comisión de ELCOP, que se dictaron jueves y viernes
 * como un solo encuentro. Si los días coinciden se muestra uno solo, y si
 * cruzan de mes se escriben completos los dos.
 *
 * El día se resuelve en la zona de Tucumán, no recortando el ISO: una clase
 * que termina a las 21:00 locales ya es "mañana" en UTC, y recortar el texto
 * mostraba dos días para una clase de uno.
 */
export function formatearRangoDeFechas(desdeIso: string, hastaIso: string): string {
  // en-CA formatea YYYY-MM-DD, que es lo que formatearFecha espera.
  const aDiaLocal = (iso: string) =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Argentina/Tucuman",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(new Date(iso));

  const desde = aDiaLocal(desdeIso);
  const hasta = aDiaLocal(hastaIso);
  if (desde === hasta) return formatearFecha(desde);

  const mismoMes = desde.slice(0, 7) === hasta.slice(0, 7);
  if (!mismoMes) return `${formatearFecha(desde)} y ${formatearFecha(hasta)}`;

  const diaDesde = Number(desde.slice(8, 10));
  return `${diaDesde} y ${formatearFecha(hasta)}`;
}

/** Iniciales para el avatar del equipo mientras no haya foto real. */
export function iniciales(nombre: string): string {
  return nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? "")
    .join("");
}
