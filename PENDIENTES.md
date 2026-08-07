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
| 9 | **Fotos de las clases y masterclass** | `PUBLICACIONES[].imagen` | Portadas provisorias generadas con la paleta municipal, que dicen "PORTADA PROVISORIA" en la propia imagen. |
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
| 16 | **Cómo procesa hoy la coordinación las postulaciones** | Coordinación Administrativa | El diseño del panel. Sin esto se construye a ciegas. |
| 17 | **Quiénes usan el panel y con qué permisos** | ELCOP | El esquema de roles. |
| 18 | **Responsable del tratamiento de datos y aviso de privacidad** | Municipalidad / Legales | Publicar el formulario. Pasamos a custodiar DNI, fecha de nacimiento y teléfono de más de mil personas. |
| 19 | **Dominio definitivo y acceso al DNS** | Municipalidad | El deploy. |
| 20 | **Dominio de envío de emails verificado** (SPF, DKIM, DMARC) | Sistemas del municipio | Confirmaciones e invitaciones. **Es el trámite más lento: conviene arrancarlo primero.** |
| 21 | **Aval para alojar datos personales en la nube** | Municipalidad | La elección de infraestructura. |
| 22 | **Formato, tamaño y fecha límite del trabajo final** | ELCOP | La pantalla de entrega. |
| 23 | **Si el trabajo final tiene jurado y puntaje** | ELCOP | La vista del comité académico: no es lo mismo descargar archivos que evaluarlos. |
| 24 | **Video del hero sin artefactos** | ELCOP / Dirección de IA | Los tres videos de fondo son animaciones generadas a partir de fotos reales. En el del telón institucional (`hero-unsta.mp4`) el generador deformó el sello de la UNSTA: donde va el lema se leen letras inventadas. Debajo del velo blanco actual no se distingue, pero **si alguna vez se sube la opacidad del fondo, ese video hay que sacarlo**. Está anotado en `VIDEOS_HERO`. |

---

## 2. Decisión técnica pendiente

**Destino real del formulario de postulación.**

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

## 4. Fuera del alcance de esta iteración

El **Portal del Becario** (login, dashboard, asistencia, repositorio de clases
y carga del proyecto final) no está implementado. La navegación lo mantiene
visible apuntando a `/portal`, que hoy es una página con "Próximamente" y nada
más.

No hay autenticación simulada a propósito: un login que no valida nada confunde
más de lo que ayuda.
