# Dónde quedamos

Punto de retomada del proyecto. Actualizado al **10 de agosto de 2026**.

Los cuatro documentos permanentes explican el *qué* y el *porqué*; este explica
el *dónde estamos parados*.

| Documento | Para qué |
|---|---|
| [`README.md`](README.md) | Cómo levantar el proyecto y dónde está cada cosa |
| [`PLAN.md`](PLAN.md) | Las fases de la segunda etapa, con estimados y riesgos |
| [`ESQUEMA.md`](ESQUEMA.md) | El modelo de contenido y por qué cada decisión |
| [`PENDIENTES.md`](PENDIENTES.md) | Los 31 datos que faltan, con responsable |

Repositorio: `DIA-SMT/Landing-Elcop`, rama **`Lucas`**. Último commit:
`3bd0a8f`.

---

## 1. Estado

**La web pública está terminada.** Diez secciones en la home, más
`/publicaciones`. Sin CMS, sin base de datos: el contenido vive en
`content/elcop.ts`.

**El Portal del Becario está en construcción, y es lo que tenemos entre manos.**
Ya no es un "Próximamente": tiene ingreso real con CIDITUC, y tres de sus cinco
secciones construidas —panel, Mis clases y Mentorías—. El árbol de trabajo está
limpio.

El detalle por sección está en §2 de este documento, y lo que le falta al portal
para servir de verdad en [`PENDIENTES.md`](PENDIENTES.md) §4.

**El esquema del CMS está escrito pero no conectado.** 18 colecciones y 5
globales en [`cms/`](cms/), tipadas y compilando. No hay `payload.config.ts` ni
base de datos. Nada de la aplicación importa `cms/`, así que el bundle no
cambia.

### Verificado, no supuesto

- Lighthouse: **99 en escritorio, 95 en móvil**, y 100 en Accesibilidad, Buenas
  prácticas y SEO en las tres páginas.
- Accesibilidad medida en 3 páginas × 3 anchos (360, 768, 1440): sin fallas de
  contraste contra el fondo efectivo, sin desborde horizontal, un solo `h1` por
  página, sin saltos de nivel, nada por debajo de 10px, ningún control por
  debajo de 44px.
- El formulario público probado de punta a punta, y el menú móvil con teclado.
- **Las tres pantallas del portal, con sesión, en 360, 768 y 1440:** sin fallas
  de contraste, sin desborde, un solo `h1`, sin saltos de nivel y sin objetivos
  táctiles chicos. El estado de error del formulario de Mentorías se midió
  aparte, porque la auditoría recorre la página en reposo y nunca lo ve.
- El envío de una consulta probado de punta a punta con datos de ejemplo.

**Lo que todavía no se midió:** Lighthouse no corrió sobre las pantallas del
portal. Son posteriores a esa medición.

---

## 2. El Portal del Becario, sección por sección

Las cinco secciones son las del prototipo. `MarcoPortal.tsx` enlaza las que
existen y muestra las demás con la etiqueta "Pronto" — visibles pero sin
enlace, para que se sepa qué va a haber sin prometer rutas que no están.

| Sección | Ruta | Estado |
|---|---|---|
| Panel | `/portal` | ✅ Commiteado (`3d9a2c8`) |
| Mis clases | `/portal/clases` | ✅ Commiteado (`3b5b940`) |
| Mentorías | `/portal/mentorias` | ✅ Commiteado (`3bd0a8f`) |
| Proyecto final | — | ⬜ Sin empezar |
| Mi beca | — | ⬜ Sin empezar |

### El ingreso ya funciona

Autenticación con **CIDITUC**, el identity provider del municipio
(`f1244bb`). La sesión vive en una cookie firmada; `lib/sesion.ts` la lee y
`app/auth/cidituc/callback/route.ts` la establece. Por eso todas las páginas del
portal son `force-dynamic`: no se pueden prerenderizar.

Dos cosas que ya se resolvieron y conviene no volver a discutir: no se guarda la
clave de firma de CIDITUC (`b9439a8`) — el perfil se consulta a
`/usuarios/authStatus` y esa consulta valida el token de paso; y el botón de
ingreso está oculto hasta que DITEC despliegue (`5100a07`).

**Falta que DITEC registre ELCOP en CIDITUC.** Está pedido en
[`docs/pedido-a-ditec.md`](docs/pedido-a-ditec.md) y el procedimiento en
[`docs/registrar-elcop-en-cidituc.md`](docs/registrar-elcop-en-cidituc.md).

### Lo último que se hizo: Mentorías

Es la **primera pantalla del portal donde el becario escribe**, así que ahí
quedaron sentadas las reglas de escritura para las que vengan.

Las piezas:

- [`components/portal/Mentorias.tsx`](components/portal/Mentorias.tsx) — próxima
  sesión, formulario y lista de consultas con su respuesta.
- [`app/portal/mentorias/page.tsx`](app/portal/mentorias/page.tsx)
- [`app/api/portal/consultas/route.ts`](app/api/portal/consultas/route.ts) — el
  `POST`, con las reglas comentadas en el encabezado.
- [`lib/portal/validacion-consulta.ts`](lib/portal/validacion-consulta.ts) —
  módulo puro que **usan cliente y servidor**: en el formulario avisa temprano,
  en el endpoint decide.

Y en los tipos: `Consulta` ganó `texto`, `sesionId`, `respuesta` y
`respondidaEn`; se sumó `SesionMentoria` con `cierreDeConsultas`, que es lo que
hace funcionar el "antes de la sesión" del documento.

**Dos modos de consulta**, que es la decisión de diseño de la pantalla: una
consulta va dirigida a una sesión programada —sólo si su cierre no pasó— o al
**canal abierto**, que no depende de ninguna fecha. Sin el canal abierto, quien
llega tarde a un cierre no tiene a dónde preguntar.

#### ⚠️ El tapón de Mentorías: las consultas se guardan en memoria

En [`lib/portal/datos.ts`](lib/portal/datos.ts) hay un `Map` colgado de
`globalThis` (`__consultasElcop`). Está documentado como provisorio, pero hay
que tenerlo presente:

- **No es persistencia.** Un reinicio la vacía.
- **En serverless cada instancia tiene la suya.** En Vercel, dos requests
  seguidos pueden ver listas distintas.
- Alcanza para probar el circuito completo —enviar, verla en la lista, que el
  servidor valide el cierre— y para nada más.

**Ninguna consulta real puede depender de esto.** Es un pendiente bloqueante
antes de que un becario de verdad use la pantalla, y el motivo es el mismo que
frena el formulario público: no hay base de datos todavía.

---

## 3. Decisiones tomadas, con su razón

Las que no se deducen leyendo el código.

| Decisión | Por qué |
|---|---|
| **Payload CMS dentro del mismo Next.js** | Resuelve panel, autenticación, subidas y permisos en un solo proyecto. Un CMS alojado dejaría las postulaciones y el portal en un segundo sistema. |
| **Vercel + Postgres gestionado**, región São Paulo | Elegido por Lucas. Implica que los datos personales salen de la infraestructura municipal: hay que confirmarlo con el municipio. |
| **CIDITUC para el ingreso al portal** | Es el identity provider del municipio: doce aplicaciones ya lo usan. Evita que ELCOP tenga su propio padrón de contraseñas. |
| **La identidad sale de la cookie, nunca del cuerpo** | Un campo `becarioId` en el JSON sería una invitación a escribir consultas a nombre de otro. |
| **El servidor revalida todo, incluso el cierre de consultas** | Una fecha límite que sólo se controla en el navegador no es una fecha límite. |
| **ISR con revalidación bajo demanda** | Para no perder el 99 de Performance cuando el contenido pase a la base. Va desde el día uno. |
| **Nada de lo que se muestra en el portal está guardado como número** | La regularidad se calcula de encuentros y asistencias cada vez. Guardar el porcentaje sería tener dos versiones del mismo dato, y la segunda siempre se desfasa. |
| **Los datos de ejemplo se anuncian en pantalla** | Un becario que ve un 89% inventado lo va a tomar por real. El aviso va arriba de todo, no en una nota al pie. |
| **El formulario se replica, no se enlaza** | Se pidió un panel para ver postulaciones. Si el formulario sigue siendo de Google, las respuestas viven en una planilla y el panel no las puede mostrar. |
| **Los campos del formulario se quedan en el código** | Cada uno está atado a una validación. Editarlos desde una pantalla la dejaría sin efecto en silencio. |
| **`alt` obligatorio a nivel de esquema** | Es la forma más común de perder el 100 en Accesibilidad después de migrar a un CMS. |
| **`esProvisorio` como campo** | La regla de "nada de demostración se presenta como oficial" hoy vive en comentarios `// TODO` que desaparecen al migrar. |
| **Sólo los presenciales cuentan para el 75%** | Elegido por Lucas. Los cancelados salen del denominador: si una clase se cae, no puede jugar en contra de nadie. |
| **Asistencia por QR con código rotativo** | Un QR fijo no mide nada: el primero que llega le saca una foto y la manda al grupo. |
| **El prototipo se rehace, no se migra** | Mantener su SPA de Vite junto a nuestro Next.js serían dos frontends y dos sistemas de diseño. Su **modelo de datos** sí se tomó. |
| **Proyecto final estructurado, no archivo** | Si es una competencia, ochenta proyectos en campos comparables se evalúan; ochenta PDF sueltos son cajas negras. |
| **Velo del hero al 82%** | Medido, no elegido a ojo: los videos tienen zonas casi negras detrás del texto, y por debajo del 80% "transforman" cae de 3:1. |

### Correcciones al sistema de diseño municipal

Tres clases compartidas no llegaban a 4,5:1 y están corregidas en la capa del
proyecto, al final de `app/globals.css`. **Conviene llevarlas también a la skill
`estetica-municipal-smt`**, porque se replican en cada proyecto nuevo:

- `.micro-label` con `slate-400` → 2,56:1
- `.section-kicker` con `municipal-600` → 3,18:1
- `municipal-700` sobre `sand` → 4,39:1 y sobre `municipal-50` → 4,49:1

---

## 4. Bloqueado, y de quién depende

En orden de urgencia.

1. **⚠️ El prototipo de Replit guarda contraseñas en texto plano** y tiene
   credenciales de prueba versionadas. *Verificar si está publicado.* Ítem 31.
2. **DITEC tiene que registrar ELCOP en CIDITUC.** Bloquea que el ingreso al
   portal funcione fuera de desarrollo, y por eso el botón sigue oculto.
3. **Dominio de envío de correo** con SPF, DKIM y DMARC. Es el trámite más
   lento y no arrancó. Depende de sistemas del municipio.
4. **Fecha de apertura de la convocatoria.** Es lo único que le pone calendario
   real a la Fase 2, que es la única con fecha externa.
5. **Aval para alojar datos personales en la nube.** Bloquea la Fase 1 — y con
   ella, la persistencia real de las consultas de mentoría.
6. **Consulta a Legales** sobre la validez exigida al Acta Compromiso. Define
   el tamaño de la Fase 4C.
7. **Calendario de encuentros de la cohorte.** Sin fechas de clase, el panel y
   Mis clases sólo pueden mostrar datos de ejemplo.
8. **Cómo procesa hoy la coordinación las postulaciones.** No bloquea, pero
   define si el panel les sirve o les estorba.

---

## 5. Lo primero que haría mañana

Hay dos caminos, y la elección no es técnica.

**Seguir el portal: Proyecto final.** Es el que sigue por dependencia — la Fase
4A lo pone junto al panel, y de las dos secciones que faltan es la que tiene
fecha externa (el cierre de la cursada). El problema es que **no se puede
terminar sin los ítems 22 y 23**: formato, tamaño y fecha límite de la entrega,
y si hay jurado y puntaje. Se puede construir la pantalla y dejar los límites
como constantes a confirmar, que es lo que se viene haciendo, pero conviene
pedir esos dos datos antes de arrancar y no después.

**Sentarse con la Coordinación Administrativa.** Sigue siendo lo único de alto
valor que no depende de terceros, y alimenta la Fase 2, que es la única con
fecha externa dura. Sin eso el panel de postulaciones se construye a ciegas.
**Está preparada en [`docs/reunion-coordinacion.md`](docs/reunion-coordinacion.md):**
el texto para coordinarla, las preguntas agrupadas por lo que desbloquean, y qué
cambia en el código según lo que respondan.

Si hay que elegir uno: **la reunión**, porque destraba trabajo ajeno y el portal
avanza igual sin ella. Mi beca queda para el final: depende de Legales (ítem 29)
y es la única parte con peso jurídico.

---

## 6. Cómo verificar que nada se rompió

```bash
npm run typecheck
```

```bash
npm run build
```

```bash
node herramientas/auditar.mjs
```

La auditoría necesita el servidor corriendo y `npm i --no-save puppeteer-core`.
Devuelve código distinto de cero si algo falla, así que sirve en un hook o en
integración continua.

Para ver el portal con datos de ejemplo hace falta `PORTAL_DATOS_DEMO=true` en
`.env.local`. Sin eso, las listas vienen vacías —que es el estado correcto
mientras no haya base— y las pantallas se ven pero no muestran nada.

### Auditar el portal, que la herramienta no alcanza

`auditar.mjs` recorre `/`, `/publicaciones` y `/portal`, y **no sabe
autenticarse**: en `/portal` mide la pantalla de ingreso, no el panel. Las
pantallas con sesión quedan fuera de su alcance.

La sesión es un JWT propio firmado con `ELCOP_SESSION_SECRET` —CIDITUC no
participa de esa parte—, así que para auditarlas alcanza con emitir una cookie
de prueba. Lo que se hizo para Mentorías, y conviene repetir en cada pantalla
nueva del portal:

1. Una ruta temporal de desarrollo que llame a `firmarSesion` y fije la cookie
   `elcop_sesion` con los mismos flags que el callback, más un `404` si
   `NODE_ENV` es producción.
2. Una copia de `auditar.mjs` con las rutas del portal en `RUTAS`, que pase por
   esa ruta una vez antes del recorrido: las páginas del mismo navegador
   comparten cookies.
3. Borrar las dos cosas antes de commitear.

**El estado de error de los formularios no lo ve nadie de eso**, porque la
auditoría mide la página en reposo. Hay que provocarlo y medirlo aparte.

---

## 7. Trampas conocidas

Cosas que ya nos costaron tiempo una vez.

**`npm run build` falla con `Cannot find module for page: /_error`.** Es que hay
un `npm run dev` corriendo sobre el mismo `.next`. Frenalo y volvé a compilar.

**El puerto 3000 queda tomado** por un `next start` anterior. `Get-Process node
| Stop-Process -Force` lo libera.

**Los mensajes de commit largos rompen en PowerShell.** Los here-strings con
acentos y barras se parsean mal. Escribilos a un archivo y usá `git commit -F`.

**`NEXT_PUBLIC_CIDITUC_LOGIN_URL` va entre comillas en el `.env`.** La URL
termina en `#/login` y sin comillas el `#` abre un comentario: se pierde la ruta
y la redirección no vuelve nunca.

**El identificador de la app en CIDITUC no es una URL nuestra.** Es una clave
que su `PrivateRoute.jsx` mapea a una URL de vuelta fija. Si el valor no está en
esa lista, la persona termina en el derivador de CIDITUC y no vuelve al portal.

**Las consultas de mentoría desaparecen al reiniciar el servidor.** No es un
bug: es el `Map` en memoria de §2.

**La auditoría no ve el video del hero.** Mide contraste contra el color de
fondo del DOM, y detrás del texto del hero hay un video que no ve. Ese cálculo
se hizo a mano midiendo fotogramas reales; está explicado en `Hero.tsx`. Si
alguien baja la opacidad del velo, la auditoría va a seguir diciendo que está
todo bien y no lo va a estar.

**Chrome headless en Windows no captura por debajo de ~500px de ancho.** Impone
un mínimo de ventana y recorta. Por eso las capturas van por CDP y no por
`--screenshot`.

---

## 8. Material fuente

Fuera del repositorio, en la máquina de Lucas:

- `Downloads/Página Web ELCOP.docx` — el pedido original de ELCOP, con la
  captura del prototipo en la última página.
- `Downloads/Web-App-Constructor.zip` — el export del Repl (104 MB, casi todo
  herramientas del agente; el código está en `artifacts/` y `lib/`).
- `Downloads/logo-elcop-smt-unsta.jpg` — el lockup del que se recortaron los
  logos. **Falta la versión vectorial.**
- `OneDrive/Escritorio/Notas Laburo/Imagenes para landign elecop/` — las cinco
  fotos reales y los tres videos.
