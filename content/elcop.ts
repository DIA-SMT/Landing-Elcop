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
 * debajo de un velo blanco al 88%: se leen como textura viva, no como imagen.
 * Se cruzan entre sí con una disolvencia de 1,4 segundos.
 *
 * No se descargan en celulares ni con movimiento reducido ni con el ahorro de
 * datos activado: en esos casos se ve sólo la portada del primero.
 *
 * ⚠ `hero-photocall` es el telón de logos, y el generador deformó el sello de
 * la UNSTA: donde va el lema se leen letras inventadas. Debajo del velo actual
 * no se distingue. **Si alguna vez se sube la opacidad del video, ese hay que
 * sacarlo de la lista.**
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
  },
  {
    id: "hero-photocall",
    mp4: "/video/hero-unsta.mp4",
    portada: "/video/hero-unsta.jpg",
    descripcion: "Telón institucional de UNSTA y Ciudad SMT"
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
    "Cuatro ejes que se recorren en orden: del liderazgo personal a la política pública que se implementa y se mide.",
  // Fuente de verdad: documento oficial de ELCOP (4 meses, 4 ejes).
  // La prensa publicó 5 meses y 2 trayectos. Ver PENDIENTES.md.
  duracion: "4 meses",
  modalidad: "Mixta: presencial + virtual sincronizada"
} as const;

/**
 * Los cuatro ejes de la diplomatura.
 *
 * El documento oficial de ELCOP trae los títulos pero no las descripciones.
 * Los textos de abajo son provisorios, escritos para sostener la maqueta, y
 * hay que reemplazarlos por el programa real antes de publicar.
 */
export const EJES: EjeFormativo[] = [
  {
    numero: 1,
    titulo: "El Sujeto Político",
    // TODO: confirmar con ELCOP — descripción provisoria.
    descripcion:
      "Quién lidera y desde dónde. El eje trabaja la construcción del perfil dirigente: ética pública, oratoria, manejo de la propia narrativa y las decisiones que se toman cuando no hay consenso.",
    // TODO: confirmar con ELCOP — temario provisorio.
    temas: ["Ética y vocación pública", "Oratoria y discurso", "Narrativa personal", "Toma de decisiones"]
  },
  {
    numero: 2,
    titulo: "El Territorio",
    // TODO: confirmar con ELCOP — descripción provisoria.
    descripcion:
      "Dónde se juega la política. Lectura del territorio y de su gente: opinión pública, análisis del electorado, trabajo con organizaciones sociales y comunicación en escala barrial.",
    // TODO: confirmar con ELCOP — temario provisorio.
    temas: ["Opinión pública", "Análisis del electorado", "Organizaciones sociales", "Comunicación territorial"]
  },
  {
    numero: 3,
    titulo: "El Estado",
    // TODO: confirmar con ELCOP — descripción provisoria.
    descripcion:
      "Cómo funciona la máquina. Arquitectura institucional del municipio, presupuesto, herramientas de gestión pública y el recorrido concreto de una política desde el expediente hasta la calle.",
    // TODO: confirmar con ELCOP — temario provisorio.
    temas: ["Arquitectura institucional", "Presupuesto municipal", "Gestión pública", "Ciclo de la política pública"]
  },
  {
    numero: 4,
    titulo: "El Impacto Final",
    // TODO: confirmar con ELCOP — descripción provisoria.
    descripcion:
      "Qué queda después. Formulación, medición y comunicación de resultados: acá cada participante desarrolla y defiende su Proyecto de Política Pública Innovadora para San Miguel de Tucumán.",
    // TODO: confirmar con ELCOP — temario provisorio.
    temas: ["Formulación de proyectos", "Indicadores de impacto", "Comunicación de resultados", "Defensa del proyecto final"]
  }
];

export const REFERENTES: Referente[] = [
  {
    nombre: "Marisol De Ambrosio",
    credencial: "Estratega en comunicación social y política digital",
    tema: "Masterclass inaugural"
  },
  {
    nombre: "Diego Reynoso",
    credencial: "Investigador CONICET · Dr. FLACSO-México",
    tema: "Opinión pública y dinámica del electorado"
  },
  {
    nombre: "Elisabeth Möhle",
    credencial: "Fundar · Ciencias ambientales",
    tema: "Desarrollo sostenible y cambio climático"
  },
  {
    nombre: "Julieta Daffonchio",
    credencial: "Politóloga · Movilidad urbana",
    tema: "Logística y transporte en el desarrollo de las ciudades"
  },
  {
    nombre: "Pablo Pérez Paladino",
    credencial: "Asociación Argentina de Consultores Políticos",
    // TODO: confirmar con ELCOP — falta el tema de la masterclass.
    tema: "Consultoría política"
  },
  {
    nombre: "Malena Dip",
    credencial: "Comunicación digital",
    // TODO: confirmar con ELCOP — falta el tema de la masterclass.
    tema: "Comunicación digital"
  },
  {
    nombre: "Laureano Bielsa",
    credencial: "Abogado especializado en finanzas",
    // TODO: confirmar con ELCOP — falta el tema de la masterclass.
    tema: "Finanzas públicas"
  }
];

/* -------------------------------------------------------------------------- */
/* Inscripciones                                                              */
/* -------------------------------------------------------------------------- */

export const INSCRIPCIONES = {
  kicker: "Inscripciones",
  titulo: "Cómo se ingresa a la Escuela",
  beca:
    "La Municipalidad de SMT y la UNSTA otorgan una Beca del 100% para todos los seleccionados.",
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
 * Notas de ejemplo armadas sobre masterclass efectivamente dictadas en la
 * cohorte 2026. Los títulos y bajadas los redactamos nosotros para poder
 * maquetar el listado: NO son textos publicados por ELCOP.
 *
 * `esEjemplo: true` hace que la interfaz los muestre marcados como ejemplo,
 * para no presentarlos como contenido oficial.
 *
 * Las portadas SÍ son fotos reales de la cohorte 2026. El texto alternativo
 * describe lo que se ve y nada más: no afirma de qué masterclass es cada una,
 * porque no lo sabemos.
 *
 * TODO: confirmar con ELCOP a qué encuentro corresponde cada foto, para poder
 * emparejarlas con la nota correcta y escribir un alt más preciso.
 */
export const PUBLICACIONES: Publicacion[] = [
  {
    slug: "masterclass-inaugural-de-ambrosio",
    titulo: "La masterclass inaugural marcó el tono de la primera cohorte",
    bajada:
      "Marisol De Ambrosio abrió la Escuela con una lectura de la comunicación política digital y del rol de la estrategia en la construcción de agenda pública.",
    // TODO: confirmar con ELCOP — fecha de ejemplo.
    fecha: "2026-03-18",
    categoria: "Masterclass",
    imagen: "/fotos/masterclass-aula.jpg",
    imagenAlt: "Encuentro de la cohorte 2026 en el aula magna de la UNSTA",
    esEjemplo: true
  },
  {
    slug: "reynoso-opinion-publica",
    titulo: "Diego Reynoso: cómo se mueve el electorado y qué mide la opinión pública",
    bajada:
      "El investigador del CONICET y doctor por FLACSO-México trabajó con los becarios la dinámica del electorado y los límites de las encuestas como herramienta de gestión.",
    // TODO: confirmar con ELCOP — fecha de ejemplo.
    fecha: "2026-04-22",
    categoria: "Masterclass",
    imagen: "/fotos/masterclass-datos.jpg",
    imagenAlt:
      "Clase de la cohorte 2026 con una presentación de datos de opinión pública proyectada",
    esEjemplo: true
  },
  {
    slug: "daffonchio-movilidad-urbana",
    titulo: "Movilidad urbana: la logística como política pública de la ciudad",
    bajada:
      "Julieta Daffonchio puso el foco en el transporte y la logística urbana como variables de desarrollo, con casos aplicables a San Miguel de Tucumán.",
    // TODO: confirmar con ELCOP — fecha de ejemplo.
    fecha: "2026-05-13",
    categoria: "Masterclass",
    imagen: "/fotos/cohorte-grupo.jpg",
    imagenAlt: "Foto grupal de los becarios de la cohorte 2026 en la UNSTA",
    esEjemplo: true
  }
];

/* -------------------------------------------------------------------------- */
/* Contacto y pie                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Datos de contacto institucional.
 *
 * La dirección está confirmada. El resto todavía no: mientras `email` y
 * `telefono` sean `null`, el pie muestra el dato como pendiente en vez de
 * inventar uno o dejar un hueco vacío.
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

/** Iniciales para el avatar del equipo mientras no haya foto real. */
export function iniciales(nombre: string): string {
  return nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? "")
    .join("");
}
