# Pendientes — Landing pública de ELCOP

Datos que faltan para poder publicar. Todo lo que está acá tiene su
contraparte marcada con `// TODO: confirmar con ELCOP` en
[`content/elcop.ts`](content/elcop.ts), que es el único lugar donde se edita
contenido.

Mientras un dato siga pendiente, la interfaz lo muestra como tal (con
`.badge-soft`) en vez de inventarlo o dejar el hueco vacío.

---

## 1. Contenido a pedirle a ELCOP

| # | Qué falta | Dónde impacta | Estado |
|---|---|---|---|
| 1 | **Descripciones de los cuatro ejes** de la diplomatura | `EJES` — sección Formación | Textos provisorios escritos por nosotros. La sección muestra el badge "Programa provisorio". |
| 2 | **Temario de cada eje** | `EJES[].temas` | Chips provisorios. |
| 3 | **Fechas exactas de la próxima cohorte** (apertura de convocatoria, inicio y fin de cursada) | `INSCRIPCIONES.proximaCohorte`, FAQ "¿Cuándo abre la próxima cohorte?" | Sin fecha. La FAQ dice que todavía no hay fecha confirmada. |
| 4 | **Mail institucional** | `CONTACTO.email` — pie | Muestra "A confirmar". |
| 5 | **Teléfono institucional** | `CONTACTO.telefono` — pie | Muestra "A confirmar". |
| 6 | **Redes sociales oficiales** (Instagram, LinkedIn, YouTube u otras) | `REDES` — pie | Muestran "A confirmar". |
| 7 | **Carpeta institucional en PDF** | `INSTITUCIONAL.carpeta` — sección Institucional | El botón está deshabilitado con la aclaración "PDF a confirmar". Al subir el archivo a `public/institucional/carpeta.pdf`, poner `disponible: true`. |
| 8 | **Fotos del equipo** (9 personas) | `EQUIPO[].integrantes[].foto` | Se muestran las iniciales sobre `sand`. El espacio reservado es del mismo tamaño que la foto, así que sumarlas no mueve la maqueta. |
| 9 | ~~Fotos de las clases y masterclass~~ · **falta saber a qué encuentro corresponde cada una** | `PUBLICACIONES[].imagen`, `INSTITUCIONAL.foto` | **Resuelto a medias.** Ya hay cinco fotos reales de la cohorte 2026 en `public/fotos/`, y las portadas provisorias generadas se eliminaron. Lo que falta: confirmar a qué masterclass corresponde cada foto, para emparejarlas con la nota correcta y escribir un texto alternativo más preciso. Hoy el alt describe sólo lo que se ve, sin afirmar de qué encuentro es. Queda sin usar `photocall-elcop.jpg`. |
| 10 | **Logos en vectorial (SVG)** de ELCOP, Ciudad SMT y UNSTA | `public/logo-*.png`, `CO_BRANDING`, `app/icon.png` | Hoy se usan recortes en PNG del lockup en JPG que nos pasaron. Sirven —`next/image` los entrega como WebP de 2,8 KB— pero pierden nitidez al escalar, no tienen fondo transparente y el ruido del JPG los deja pesados en el repo (170 KB el lockup). El favicon también sale de ahí. |
| 11 | **Temas de tres masterclass** | `REFERENTES` — Pablo Pérez Paladino, Malena Dip, Laureano Bielsa | Sólo tenemos su credencial; el tema está inferido de ella. |
| 12 | **Detalle formal de la certificación** que se entrega | FAQ "¿Qué certificado recibo?" | Redacción provisoria. |
| 13 | **Textos reales de las publicaciones** | `PUBLICACIONES` | Las tres notas son de ejemplo: se armaron sobre masterclass que sí se dictaron, pero los títulos, bajadas y fechas los redactamos nosotros. La página lo avisa arriba de todo y en cada tarjeta. |

---

## 1 bis. Lo que hace falta para la segunda etapa

Estos salieron de las tres definiciones nuevas (sitio auto-gestionable,
formulario de inscripción, entrega del trabajo final). El plan completo está en
[`PLAN.md`](PLAN.md); acá quedan sólo las cosas que hay que **pedir**.

| # | Qué falta | De quién | Bloquea |
|---|---|---|---|
| 14 | **Fecha de apertura de la próxima convocatoria** | ELCOP | Todo el cronograma: es la única fecha externa de la etapa de postulaciones. |
| 15 | **El formulario de la 1ª convocatoria y su planilla de respuestas** | ELCOP | Los campos reales del formulario. La planilla dice cuáles se usaron y cuáles quedaron vacíos. |
| 16 | **Cómo procesa hoy la coordinación las postulaciones** | Coordinación Administrativa | El diseño del panel. Sin esto se construye a ciegas. **La reunión está preparada en [`docs/reunion-coordinacion.md`](docs/reunion-coordinacion.md)**, que cubre también los ítems 15 y 17. |
| 17 | **Quiénes usan el panel y con qué permisos** | ELCOP | El esquema de roles. |
| 18 | **Responsable del tratamiento de datos y aviso de privacidad** | Municipalidad / Legales | Publicar el formulario. Pasamos a custodiar DNI, fecha de nacimiento y teléfono de más de mil personas. |
| 19 | **Dominio definitivo y acceso al DNS** | Municipalidad | El deploy. |
| 20 | **Dominio de envío de emails verificado** (SPF, DKIM, DMARC) | Sistemas del municipio | Confirmaciones e invitaciones. **Es el trámite más lento: conviene arrancarlo primero.** |
| 21 | **Aval para alojar datos personales en la nube** | Municipalidad | La elección de infraestructura. |
| 22 | **Formato, tamaño y fecha límite del trabajo final** | ELCOP | La pantalla de entrega. |
| 23 | **Si el trabajo final tiene jurado y puntaje** | ELCOP | La vista del comité académico: no es lo mismo descargar archivos que evaluarlos. |
| 31 | ⚠️ **URGENTE — el prototipo de Replit guarda las contraseñas en texto plano** | Félix Agustín Paz / Dirección de IA | En `artifacts/api-server/src/routes/auth.ts`, `checkPassword` compara con `===`. La columna se llama `passwordHash`, lo que hace parecer que estuvieran hasheadas. Además `replit.md` trae credenciales de prueba versionadas (`ana.gomez@elcop.edu.ar` / `becario123`). **Hay que verificar si ese Repl está publicado**: si lo está, cualquiera con el enlace entra como becario. El propio `replit.md` lo reconoce como pendiente, pero no puede sobrevivir a la mudanza. |
| 25 | ~~Acceso al prototipo del Portal en Replit~~ | Félix Agustín Paz | El documento trae un enlace de invitación (`replit.com/join#…`), que sirve para sumar a una persona a la cuenta, no para mirar el proyecto. Hace falta la URL de la app publicada o el código exportado en zip. |
| 26 | **Tres frases oficiales que hoy están parafraseadas** | — | El documento dice: *"Con el objetivo de promover el talento y la excelencia en la función pública, la Municipalidad de SMT y la UNSTA otorgan una Beca del 100%…"*; *"…permitiendo un aprendizaje flexible pero con fuerte anclaje en el networking presencial"*; y encadena cupos con proceso: *"Debido a que los cupos son limitados, el proceso de selección consta de dos etapas obligatorias"*. Falta decidir si se reemplazan por el texto textual. |
| 27 | **Qué indicadores de la ciudad se publican, y con qué fuente** | ELCOP | Cada indicador necesita fuente y fecha de corte: un número sin origen en un sitio oficial es un problema. |
| 28 | **Calendario de encuentros de la cohorte** | ELCOP | Sin fechas de clase no hay "próxima sesión" ni de qué colgar la asistencia. **Subió de prioridad:** el panel y Mis clases ya están construidos y hoy sólo pueden mostrar datos de ejemplo. Es el dato que los vuelve reales. |
| 29 | **Validez legal exigida al Acta Compromiso** | Legales | Aceptar con un clic es firma electrónica; la firma digital de la Ley 25.506 es otra cosa. Define cuánto trabajo es la Fase 4C. |
| 30 | **Confirmar el año de la cohorte** | ELCOP | El prototipo dice "Cohorte ELCOP ELCOP 2025" (con el nombre repetido). El sitio dice 2026, que coincide con el brief y con la fecha de las fotos. Lo tomamos como dato viejo del prototipo. |
| 24 | **Video del hero sin artefactos** | ELCOP / Dirección de IA | Los tres videos de fondo son animaciones generadas a partir de fotos reales. En el del telón institucional (`hero-unsta.mp4`) el generador deformó el sello de la UNSTA: donde va el lema se leen letras inventadas. Debajo del velo blanco actual no se distingue, pero **si alguna vez se sube la opacidad del fondo, ese video hay que sacarlo**. Está anotado en `VIDEOS_HERO`. |

---

## 2. Decisiones técnicas pendientes

Las dos tienen la misma raíz: **todavía no hay base de datos.** Las dos están
resueltas en cuanto a *qué* hay que hacer, y frenadas por el ítem 21.

### 2 a. Destino real del formulario de postulación

> **Actualizado:** ya está decidido que las postulaciones se guardan en base de
> datos propia y se leen desde un panel, y que el formulario de la 1ª
> convocatoria se toma como especificación de campos en vez de enlazarlo. El
> razonamiento está en [`PLAN.md`](PLAN.md) §4. Lo de abajo describe el estado
> actual del código, que sigue siendo el tapón.

Hoy el formulario hace `POST` a `/api/postulacion`, que valida el cuerpo,
loguea que llegó una postulación y devuelve 200. **No persiste nada.**

El handler está en [`app/api/postulacion/route.ts`](app/api/postulacion/route.ts)
y el único punto de contacto con el destino final es la función
`guardarPostulacion`: enchufar el destino real debería ser cambiar sólo esa
función.

Hay que definir a dónde van las postulaciones:

- ¿Una planilla de Google Sheets?
- ¿Un mail institucional?
- ¿Una base de datos propia?
- ¿El sistema de gestión de alumnos de la UNSTA?

De la respuesta dependen también dos cosas que todavía no están resueltas:

- **Protección contra envíos automatizados.** Sin captcha ni límite de
  frecuencia, un formulario público de una convocatoria con 1.091 postulantes
  es un blanco cómodo.
- **Tratamiento de datos personales.** El formulario pide DNI, fecha de
  nacimiento y teléfono. Falta definir quién es el responsable del tratamiento
  y sumar el aviso de privacidad correspondiente antes de publicar.

Mientras tanto, la pantalla de confirmación avisa que el envío todavía no queda
registrado, para no dar por presentada una postulación que no se guardó.

### 2 b. Las consultas de mentoría se guardan en memoria del proceso

⚠️ Mismo tapón que el de arriba, en la primera pantalla del portal donde el
becario **escribe**.

[`lib/portal/datos.ts`](lib/portal/datos.ts) guarda las consultas enviadas en un
`Map` colgado de `globalThis` (`__consultasElcop`). Está documentado como
provisorio en el propio archivo, pero conviene que figure acá:

- **No es persistencia.** Un reinicio del servidor la vacía.
- **En un despliegue serverless cada instancia tiene la suya.** En Vercel, dos
  requests seguidos pueden ver listas distintas.
- Se cuelga de `globalThis` para sobrevivir a la recompilación en caliente de
  Next en desarrollo, que reinicia el módulo pero no el proceso.

Alcanza para probar el circuito completo —enviar, ver la consulta en la lista,
que el servidor valide el cierre de la sesión— y para nada más. **Ninguna
consulta real puede depender de esto:** antes de que un becario de verdad use la
pantalla hay que reemplazar `registrarConsulta` por una escritura a la base.

Lo que *sí* está resuelto y no hay que rehacer: la validación compartida entre
cliente y servidor ([`lib/portal/validacion-consulta.ts`](lib/portal/validacion-consulta.ts)),
que la identidad salga de la cookie y nunca del cuerpo, y que el cierre de
consultas se revalide en el servidor. Enchufar la base debería ser cambiar una
sola función.

---

## 3. Inconsistencia a confirmar: duración y estructura

Hay dos versiones en circulación sobre cuánto dura la diplomatura y cómo está
organizada:

| Fuente | Duración | Estructura |
|---|---|---|
| **Documento oficial de ELCOP** | 4 meses | 4 ejes |
| Prensa | 5 meses | 2 trayectos |

**Estamos tomando el documento oficial como fuente de verdad**: la landing dice
4 meses y 4 ejes en todos lados (hero, indicadores, sección Formación,
Inscripciones y FAQ).

Hay que confirmarlo con ELCOP. Si la versión correcta resultara ser la de
prensa, el cambio se hace en `DIPLOMATURA.duracion`, `INDICADORES` y `EJES` de
`content/elcop.ts`, y no toca ningún componente.

---

## 4. Estado del Portal del Becario

**Ya no está fuera de alcance: está en construcción.** El "Próximamente" de
`/portal` se reemplazó por pantallas reales, y el ingreso no es simulado —
autentica contra CIDITUC, el identity provider del municipio.

| Sección | Ruta | Estado |
|---|---|---|
| Panel — termómetro de regularidad, estado académico, próximo encuentro | `/portal` | ✅ Hecho |
| Mis clases — repositorio por módulo | `/portal/clases` | ✅ Hecho |
| Mentorías — consultas y sesiones | `/portal/mentorias` | ✅ Hecho |
| Proyecto final — carga de la entrega | — | ⬜ Sin empezar |
| Mi beca — Contrato y Acta Compromiso | — | ⬜ Sin empezar |

Las dos secciones sin empezar se muestran igual en la navegación, marcadas como
"Pronto" y sin enlace: esconderlas dejaría a la persona sin saber qué va a poder
hacer acá, pero enlazarlas la mandaría a una ruta que no existe.

Ninguna pantalla del portal muestra un número guardado: la regularidad se
calcula de los encuentros y las asistencias cada vez. Y cuando lo que se ve son
datos de ejemplo, la interfaz lo dice arriba de todo — un becario que ve un 89%
inventado lo va a tomar por real.

### Lo que le falta al portal para servir de verdad

| Qué | De quién / de qué depende |
|---|---|
| **Que DITEC registre ELCOP en CIDITUC** | Sin eso el ingreso no funciona fuera de desarrollo, y por eso el botón sigue oculto. Pedido en [`docs/pedido-a-ditec.md`](docs/pedido-a-ditec.md). |
| **Persistencia real** de asistencias, materiales y consultas | La base de datos, que depende del ítem 21. Ver §2 b. |
| **Calendario de encuentros** | ELCOP, ítem 28. Es lo que convierte el panel y Mis clases en algo con datos propios. |
| ~~Medir las pantallas del portal~~ | **Hecho.** Lighthouse da 100 en Accesibilidad, Buenas prácticas y SEO en las tres, con Performance de 96 a 100. Encontró dos fallas que la auditoría propia no detecta: ver `CONTEXTO.md` §6. |
