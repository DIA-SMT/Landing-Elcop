# Esquema de contenido

Diseño de las colecciones del CMS, derivado de los tipos que ya están en
[`content/elcop.ts`](content/elcop.ts).

> **El esquema ya está escrito como código en [`cms/`](cms/).** Este documento
> explica el porqué de cada decisión; los archivos de `cms/` son la traducción
> a configuración de Payload, y compilan.
>
> **Todavía no están conectados**: no hay `payload.config.ts` ni base de datos.
> Conectarlos hoy rompería el sitio, que funciona sin base. Cuando se resuelva
> la Fase 0 del [`PLAN.md`](PLAN.md), armar la configuración es importar
> `colecciones` y `globales` de [`cms/index.ts`](cms/index.ts).
>
> Falta el esquema del Portal del Becario: entregas, calendario de encuentros,
> asistencia, materiales, consultas de mentoría y actas. Queda para cuando el
> alcance esté cerrado, que hoy depende de revisar el prototipo y de la
> definición legal del acta compromiso.

La regla que ordena todo: **el tipo de TypeScript que ya existe es el contrato.**
Si una colección devuelve exactamente la forma que hoy tiene el módulo de
contenido, los componentes no se tocan — sólo cambia de dónde leen.

---

## 1. Cómo se decide global o colección

- **Global** (una sola instancia, sin listado): un bloque de la página que
  existe una vez y siempre. No se agrega ni se borra, sólo se edita.
- **Colección** (listado, se agregan y borran ítems): cosas que crecen.

| Hoy en `content/elcop.ts` | Pasa a ser | Por qué |
|---|---|---|
| `ESCUELA` | Global · Escuela | Nombre e identidad. Se toca una vez por década. |
| `HERO` | Global · Inicio | Un solo hero. |
| `INDICADORES` | Colección · Indicadores | Son cuatro hoy, pueden ser tres o cinco. |
| `INSTITUCIONAL` | Global · Institucional | Un solo bloque de texto. |
| `EQUIPO` | Colección · Integrantes | Crece y rota. Ver §3.2. |
| `DIPLOMATURA` | Global · Diplomatura | Encabezado de la sección Formación. |
| `EJES` | Colección · Ejes | Cuatro hoy; el programa puede cambiar. |
| `REFERENTES` | Colección · Referentes | Crece con cada masterclass. Es la que más va a crecer. |
| `INSCRIPCIONES` | Global · Inscripciones | Beca, etapas, cursada, evaluación final, cupos. |
| `FAQ` | Colección · Preguntas frecuentes | Crece con lo que consultan. |
| `PUBLICACIONES` | Colección · Publicaciones | Es la razón principal del panel. |
| `CONTACTO`, `REDES`, `CO_BRANDING` | Global · Pie | Todo lo del pie junto. |
| `FORMULARIO` | **Se queda en código** | Ver §2. |
| `formatearNumero`, `formatearFecha`, `iniciales` | Se quedan en código | Son presentación, no contenido. |

---

## 2. Lo que NO va al panel, y por qué

**`FORMULARIO.campos` se queda en el código.**

Parece contenido —son etiquetas y textos de ayuda— pero cada campo está atado a
una regla de validación en `FormularioPostulacion.tsx`: el DNI valida contra
7 u 8 dígitos, la fecha de nacimiento calcula edad mínima, la motivación tiene
piso de 100 caracteres. Si el `id` de un campo se puede editar desde una
pantalla, alguien lo cambia sin saberlo y la validación deja de aplicar en
silencio. No hay error, no hay aviso: simplemente entran datos malos.

Agregar o quitar un campo de este formulario es una tarea de desarrollo, no de
contenido. Es de las pocas cosas donde "auto-gestionable" es la respuesta
equivocada.

Lo que **sí** puede editarse desde el panel sin riesgo: el título, la bajada y
el texto de la pantalla de confirmación. Eso va en el Global · Inscripciones.

---

## 3. Colecciones de contenido

Notación: `nombre` (tipo) — nota.

### 3.1 Indicadores

| Campo | Tipo | Nota |
|---|---|---|
| `valor` | número entero | 1091, 80, 100, 4 |
| `sufijo` | texto, opcional | `%` |
| `etiqueta` | texto | "Postulantes" |
| `detalle` | texto | "En la primera convocatoria" |
| `orden` | número | Ordenamiento manual. Ver §5.1. |
| `esProvisorio` | booleano | Ver §5.2. |

El formato de miles lo sigue haciendo `formatearNumero` en el código: el panel
guarda `1091`, no `"1.091"`. Guardar el número ya formateado rompe el contador
animado y la localización.

### 3.2 Integrantes (equipo)

Hoy son tres grupos con integrantes adentro. En el panel eso serían dos
colecciones anidadas para administrar nueve personas, que es más ceremonia que
beneficio.

**Propuesta:** una sola colección de personas, con el grupo como campo de
selección de opciones fijas.

| Campo | Tipo | Nota |
|---|---|---|
| `tratamiento` | texto | "Dra.", "Mg. Ing.", "Sr." |
| `nombre` | texto | |
| `grupo` | selección | `direccion` · `coordinacion-academica` · `coordinacion-administrativa` |
| `foto` | relación a Media, opcional | Si está vacío, la interfaz muestra las iniciales sobre `sand`, como hoy. |
| `orden` | número | Dentro de cada grupo. |

Los títulos y descripciones de los tres grupos van en el Global · Institucional,
porque son texto fijo, no datos que se repitan por persona.

Si algún día hacen falta más grupos, se convierte en colección aparte. Hoy no
lo justifica.

### 3.3 Ejes

| Campo | Tipo | Nota |
|---|---|---|
| `numero` | número | Se muestra con cero adelante: `01`. Lo hace el código. |
| `titulo` | texto | |
| `descripcion` | área de texto | **Hoy es provisoria.** Ver §5.2. |
| `temas` | lista de textos | Los chips del recorrido. |
| `orden` | número | |
| `esProvisorio` | booleano | Arranca en `true` para los cuatro. |

### 3.4 Referentes

| Campo | Tipo | Nota |
|---|---|---|
| `nombre` | texto | |
| `credencial` | texto | "Investigador CONICET · Dr. FLACSO-México" |
| `tema` | texto | |
| `foto` | relación a Media, opcional | Mismo criterio que el equipo: sin foto, iniciales. |
| `fecha` | fecha, opcional | Hoy no se muestra. Sirve para ordenar por masterclass más reciente. |
| `orden` | número | |
| `esProvisorio` | booleano | Tres referentes tienen el tema inferido de su credencial. |

### 3.5 Preguntas frecuentes

| Campo | Tipo | Nota |
|---|---|---|
| `pregunta` | texto | |
| `respuesta` | texto enriquecido | Necesita al menos enlaces y negritas. |
| `orden` | número | |
| `esProvisorio` | booleano | Dos respuestas son provisorias hoy. |

### 3.6 Publicaciones

La colección que más se va a usar. Vale la pena que su formulario de carga sea
el más cuidado del panel.

| Campo | Tipo | Nota |
|---|---|---|
| `titulo` | texto | |
| `slug` | texto | Se genera del título, editable. Único. |
| `bajada` | área de texto | |
| `cuerpo` | texto enriquecido | **Nuevo.** Habilita la nota completa, que hoy no existe. Ver §6. |
| `fecha` | fecha | |
| `categoria` | selección | "Masterclass", "Novedades", "Institucional" |
| `imagen` | relación a Media | Obligatoria. |
| `estado` | selección | `borrador` · `publicada`. Ver §5.3. |
| `esEjemplo` | booleano | Las tres actuales arrancan en `true`. |

### 3.7 Media

La colección de archivos subidos. Una sola regla, y no es negociable:

> **`alt` es obligatorio a nivel de esquema.**

Hoy el sitio da 100 en Accesibilidad. La forma más común de perder ese número
después de migrar a un CMS es que alguien suba una imagen sin texto
alternativo. Si el campo es obligatorio en el esquema, el panel no deja
guardar y el problema no llega a producción.

| Campo | Tipo | Nota |
|---|---|---|
| `alt` | texto | **Obligatorio.** |
| `credito` | texto, opcional | Autoría de la foto. |

Tamaños generados automáticamente para que `next/image` no tenga que
redimensionar en cada visita: portada de publicación (16:9), retrato de equipo
(1:1) y original.

---

## 4. Colecciones de las fases 2 y 4

No son contenido: son datos que genera la gente.

### 4.1 Postulaciones (Fase 2)

Se crean sólo desde el formulario público. **Nadie las crea a mano desde el
panel**, y los campos de datos personales son de sólo lectura ahí: el panel
sirve para leer y clasificar, no para editar lo que alguien declaró.

| Campo | Tipo | Nota |
|---|---|---|
| Los campos del formulario | — | Sólo lectura en el panel. |
| `estado` | selección | `recibida` · `entrevistada` · `seleccionada` · `no seleccionada` |
| `notasInternas` | área de texto | Editable. Sólo la ve el staff. |
| `recibidaEn` | fecha y hora | Automática. |

Necesita búsqueda, filtro por estado y exportación a CSV. Con 1.091
postulaciones en la primera convocatoria, un listado sin filtros es inservible.

### 4.2 Usuarios (Fase 1 y 4)

Colección de autenticación, con roles:

- `admin` — dirección. Todo.
- `staff` — coordinación. Contenido y postulaciones.
- `becario` — sólo su propia entrega. Sin acceso al panel de contenido.

**Sin registro público.** Las cuentas de becario se crean a partir de las
postulaciones marcadas como `seleccionada`, y se invitan por email. Que el
conjunto de usuarios sea cerrado es una propiedad de seguridad que conviene
conservar.

### 4.3 Entregas (Fase 4)

| Campo | Tipo | Nota |
|---|---|---|
| `becario` | relación a Usuarios | |
| `archivo` | archivo subido | Formato y tamaño a definir con ELCOP. |
| `titulo` | texto | Nombre del proyecto. |
| `resumen` | área de texto | |
| `entregadaEn` | fecha y hora | Automática. |

La fecha límite se valida **en el servidor**. Una fecha límite que sólo se
controla en el navegador no es una fecha límite.

---

## 5. Cuatro decisiones que conviene tomar ahora

### 5.1 El orden es un campo, no el azar

Indicadores, ejes, integrantes y referentes se muestran en un orden que
significa algo: los ejes son un recorrido, el equipo tiene jerarquía. Si el
listado sale ordenado por fecha de creación, el primer día que alguien edite un
eje se le va al final.

Cada colección ordenable lleva un campo `orden` con arrastrar y soltar en el
panel.

### 5.2 Cómo sobrevive la regla de "nada provisorio se muestra como oficial"

Hoy esa regla vive en dos lugares: un comentario `// TODO: confirmar con ELCOP`
en el código, y un badge en la interfaz. Al migrar, el comentario desaparece —
y con él, el aviso.

**La traducción es un campo booleano `esProvisorio` por registro.** La interfaz
ya sabe qué hacer con él: es el mismo badge que hoy muestra "Programa
provisorio" y "Contenido de ejemplo". Quien carga contenido lo destilda cuando
el dato se confirma, y el aviso desaparece solo.

Sin esto, la primera migración borra silenciosamente una de las reglas de
calidad del proyecto.

### 5.3 Borrador y publicado

Sólo lo necesitan las publicaciones: alguien empieza a escribir una nota y no
la termina en una sentada. El resto del contenido se edita sobre lo publicado.

Agregar borradores a todas las colecciones duplica cada registro y complica el
panel sin que nadie lo pida.

### 5.4 La revalidación va desde el principio

Cada colección y cada global lleva un hook que, al guardar, revalida las rutas
que lo usan:

| Colección | Revalida |
|---|---|
| Publicaciones | `/publicaciones` y `/` |
| Todo el resto del contenido | `/` |

Sin esto hay dos finales posibles y los dos son malos: o el sitio consulta la
base en cada visita —y se pierde el 100 de Performance—, o ELCOP guarda un
cambio, no lo ve reflejado, y concluye que el panel no funciona.

---

## 6. Una decisión de producto que aparece sola

Hoy `/publicaciones` es un listado sin páginas de detalle: cada tarjeta muestra
título, bajada y fecha, y no lleva a ningún lado.

Con un CMS eso deja de tener sentido — nadie escribe notas en un panel para que
no se puedan leer. Por eso el campo `cuerpo` de §3.6, y una ruta nueva
`/publicaciones/[slug]`.

Es alcance que no estaba pedido, así que lo dejo anotado y no lo doy por
aprobado. Pero conviene decidirlo antes de migrar y no después, porque cambia el
esquema.

---

## 7. Qué hay que confirmar antes de implementar

1. **¿Las publicaciones llevan página propia?** (§6)
2. **¿Quiénes usan el panel y con qué rol?** ¿Alcanza distinguir dirección de
   coordinación administrativa? (ítem 17 de [`PENDIENTES.md`](PENDIENTES.md))
3. **¿Cómo trabaja hoy la coordinación con las postulaciones?** Define si el
   panel de §4.1 les sirve o les estorba. (ítem 16)
4. **Formato, tamaño y fecha límite del trabajo final.** (ítem 22)
5. **¿Hay jurado y puntaje?** Si lo hay, §4.3 necesita campos de evaluación.
   (ítem 23)
