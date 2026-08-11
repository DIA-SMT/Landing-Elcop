# Dónde quedamos

Punto de retomada. Actualizado al **10 de agosto de 2026**.

Los cuatro documentos permanentes explican el *qué* y el *porqué*; este explica
el *dónde estamos parados*. **La historia de cada cambio está en `git log`**, con
mensajes largos a propósito: acá va sólo lo que hace falta para retomar.

| Documento | Para qué |
|---|---|
| [`README.md`](README.md) | Cómo levantar el proyecto, verlo y auditarlo |
| [`PLAN.md`](PLAN.md) | Las fases de la segunda etapa, con estimados y riesgos |
| [`ESQUEMA.md`](ESQUEMA.md) | El modelo de contenido y por qué cada decisión |
| [`PENDIENTES.md`](PENDIENTES.md) | Los datos que faltan, con responsable |
| [`docs/ingreso-cidituc.md`](docs/ingreso-cidituc.md) | Todo el ingreso: cómo funciona, cómo probarlo, qué falta |
| [`docs/reunion-coordinacion.md`](docs/reunion-coordinacion.md) | La reunión que desbloquea el panel de postulaciones |

Repositorio `DIA-SMT/Landing-Elcop`, rama **`Lucas`**.

---

## 1. Estado

**La web pública está terminada** — diez secciones en la home más
`/publicaciones`, con un asistente en burbuja. Sin CMS y sin base de datos: el
contenido vive en `content/elcop.ts`.

**El Portal del Becario tiene cuatro de sus cinco secciones**, y el **ingreso con
CIDITUC funciona de punta a punta en desarrollo** (probado el 10 de agosto con una
cuenta real). Falta Mi beca, que depende de Legales.

| Sección | Ruta | Estado |
|---|---|---|
| Panel | `/portal` | ✅ |
| Mis clases | `/portal/clases` | ✅ |
| Mentorías | `/portal/mentorias` | ✅ |
| Proyecto final | `/portal/proyecto` | ✅ sin el adjunto opcional |
| Mi beca | — | ⬜ depende de Legales (ítem 29) |
| Comité académico | `/comite` | ✅ sin aprobar (ítem 23) |

Las secciones que faltan igual se ven en la navegación, marcadas "Pronto": que se
sepa qué va a haber, sin enlazar a rutas que no existen.

**El esquema del CMS está escrito y no conectado.** 18 colecciones en
[`cms/`](cms/), tipadas y compilando. Nada de la aplicación las importa.

### Medido, no supuesto

- **Lighthouse 100 en Accesibilidad, Buenas prácticas y SEO** en todas las
  páginas. Performance: 98 escritorio / 93 móvil en la home (el asistente cuesta
  1 y 2 puntos), 96 a 100 en el portal y el comité.
- **Accesibilidad en 360, 768 y 1440** en las páginas públicas, las cuatro del
  portal, las dos del comité y el panel del chat abierto.
- Los circuitos de escritura probados de punta a punta: consulta de mentoría,
  proyecto final (borrador y presentación), devolución del comité, y los permisos
  del comité con sesión de becario y de comité.

### La base de datos existe (11/8/2026)

Supabase (Postgres, región São Paulo); las tablas están en
[`db/migraciones`](db/migraciones) y el cliente en `lib/supabase.ts`. El
navegador nunca habla con la base: todo pasa por el servidor con la clave
secreta, y el RLS queda encendido sin políticas como cinturón. Sin
`SUPABASE_URL` configurada, cada módulo cae a su implementación provisoria
(memoria o variable de entorno), así el proyecto anda sin credenciales.

Lo que cambió y lo que no:

- **Entregas, consultas y asistencias persisten** en sus tablas — verificado
  guardando, reiniciando el servidor y releyendo. El único `Map` que queda en
  memoria es el contador del chat, y para frenar abuso casero alcanza.
- **El padrón y el comité viven en tablas** (`becarios`, `comite`): se agrega o
  saca gente sin redeploy. `ELCOP_PADRON_PROVISORIO` y `ELCOP_COMITE_PROVISORIO`
  quedan sólo como respaldo de desarrollo.
- **El proyecto final sigue guardando una sola versión.** Editar y guardar
  después de presentar retira la entrega, y la pantalla lo dice así.
- **Los materiales todavía no tienen archivo real**: falta el almacenamiento
  (Supabase Storage), que es otro paso.

El aval para alojar datos personales en la nube (ítem 21) quedó **asumido por
la Dirección el 11/8/2026, formalización pendiente**.

---

## 2. Decisiones tomadas, con su razón

Las que no se deducen leyendo el código.

| Decisión | Por qué |
|---|---|
| **Payload CMS dentro del mismo Next.js** | Un CMS alojado dejaría las postulaciones y el portal en un segundo sistema. |
| **Vercel + Postgres gestionado**, São Paulo | Elegido por Lucas. Implica que los datos personales salen de la infraestructura municipal: hay que confirmarlo. |
| **CIDITUC para el ingreso** | Es el identity provider del municipio. Evita que ELCOP tenga su propio padrón de contraseñas. |
| **La identidad sale de la cookie, nunca del cuerpo** | Un `becarioId` en el JSON sería una invitación a escribir a nombre de otro. |
| **El rol no va en la cookie, se resuelve por pedido** | En la cookie, quitarle el permiso a alguien no tendría efecto hasta que venza. |
| **Sin rol es 404, no 403** | Un 403 confirma que existe algo del otro lado. |
| **El servidor revalida todo, incluidas las fechas límite** | Una fecha que sólo se controla en el navegador no es una fecha límite. |
| **Nada del portal se guarda como número** | La regularidad se calcula cada vez. Guardar el porcentaje son dos versiones del mismo dato, y la segunda se desfasa. |
| **Los datos de ejemplo se anuncian en pantalla** | Un becario que ve un 89% inventado lo toma por real. |
| **El asistente sólo responde con el contenido del sitio** | Y lo que falta está como `null` en el código, así que dice que falta confirmarlo en vez de inventarlo. |
| **La clave del asistente nunca va al navegador** | Una clave que paga por token, expuesta en el cliente, es una clave pública que gasta dinero. |
| **ISR con revalidación bajo demanda** | Para no perder el 99 de Performance cuando el contenido pase a la base. |
| **El formulario se replica, no se enlaza** | Si sigue siendo de Google, las respuestas viven en una planilla y el panel no las muestra. |
| **Los campos del formulario se quedan en el código** | Cada uno está atado a una validación; editarlos desde una pantalla la dejaría sin efecto en silencio. |
| **`alt` obligatorio a nivel de esquema** | Es la forma más común de perder el 100 en Accesibilidad al migrar a un CMS. |
| **Sólo los presenciales cuentan para el 75%** | Elegido por Lucas. Si una clase se cae, no puede jugar en contra de nadie. |
| **Asistencia por QR rotativo** | Un QR fijo no mide nada: el primero que llega le saca una foto y la manda al grupo. |
| **El prototipo se rehace, no se migra** | Serían dos frontends y dos sistemas de diseño. Su **modelo de datos** sí se tomó. |
| **Proyecto final estructurado, no archivo** | Ochenta proyectos en campos comparables se evalúan; ochenta PDF sueltos son cajas negras. |
| **Velo del hero al 82%** | Medido: por debajo del 80% "transforman" cae de 3:1 sobre los fotogramas reales. |

### Correcciones al sistema de diseño municipal

Tres clases compartidas no llegaban a 4,5:1 y están corregidas al final de
`app/globals.css`. **Conviene llevarlas a la skill `estetica-municipal-smt`**,
porque se replican en cada proyecto nuevo:

- `.micro-label` con `slate-400` → 2,56:1
- `.section-kicker` con `municipal-600` → 3,18:1
- `municipal-700` sobre `sand` → 4,39:1 y sobre `municipal-50` → 4,49:1

---

## 3. Bloqueado, y de quién depende

En orden de urgencia.

1. **⚠️ El prototipo de Replit guarda contraseñas en texto plano** y tiene
   credenciales de prueba versionadas. *Verificar si está publicado.* Ítem 31.
2. **DITEC tiene que desplegar el ingreso en Derivador.** El merge ya está hecho
   (10/8/2026); falta el despliegue, previsto para el 11/8. Ojo con confundir una
   cosa con la otra: el PR #96 de Agustín también estaba mergeado en `dev` y sin
   desplegar, y lo que destraba es siempre el despliegue.
3. **El padrón real de becarios.** Sin `ELCOP_PADRON_PROVISORIO` cargada en
   Vercel, todo el que se autentique bien va a ver "no figurás entre los
   becarios". Es nuestro y es rápido, pero hay que acordarse antes de encender
   el ingreso.
4. **Dominio de envío de correo** con SPF, DKIM y DMARC. El trámite más lento y
   no arrancó.
5. **Fecha de apertura de la convocatoria.** Lo único que le pone calendario a la
   Fase 2.
6. **Formalizar el aval para alojar datos personales en la nube.** La Dirección
   lo asumió el 11/8/2026 y la base ya corre en Supabase; falta el papel que lo
   respalde. **Aplica también al asistente**, que manda los mensajes de los
   visitantes a OpenRouter.
7. **Consulta a Legales** sobre la validez del Acta Compromiso. Define Mi beca.
8. **Registro de asistencia de la cohorte.** El calendario real ya está cargado
   (11/8/2026, `lib/portal/calendario.ts`); sin las asistencias el panel dice
   "sin registro" en vez de calcular la regularidad. También faltan horarios,
   aulas y materiales, que el documento de ELCOP no trae.
9. **Cómo procesa hoy la coordinación las postulaciones.** No bloquea, pero
   define si el panel les sirve o les estorba.

---

## 4. Lo primero que haría mañana

**Encender el ingreso, cuando DITEC despliegue.** Son dos variables en Vercel y
van juntas, en el mismo movimiento:

- `CIDITUC_INGRESO_HABILITADO=true`
- `ELCOP_PADRON_PROVISORIO` con los documentos reales

Encender la primera sin la segunda deja el ingreso funcionando y rechazando a
todo el mundo con "no figurás entre los becarios", que se ve idéntico a estar
roto. Después de desplegar, probar con una cuenta propia y mirar los registros de
Vercel: cualquier falla deja una línea `[cidituc] perfil no obtenido — …` que dice
de quién es el problema.

**Sentarse con la Coordinación Administrativa.** Lo único de alto valor que no
depende de terceros, y alimenta la Fase 2, que es la única con fecha externa dura.
Está preparada en
[`docs/reunion-coordinacion.md`](docs/reunion-coordinacion.md).

Si aparece tiempo de teclado, lo que más rinde es **conectar la base** (Fase 1):
destraba los tres tapones de §1 de una vez.

---

## 5. Cómo verificar que nada se rompió

Los comandos y cómo ver el portal con sesión están en el
[`README.md`](README.md). En resumen: `npm run typecheck`, `npm run build`,
`npm run auditar`, `npm run auditar:portal`, `npm run auditar:comite`, y
`npm run portal` para abrirlo con sesión.

### ⚠️ `auditar.mjs` no reemplaza a Lighthouse

Ya costó dos bugs commiteados como verificados. La auditoría propia mide
contraste, desborde, jerarquía de encabezados, tipografía y objetivos táctiles —
**no valida ARIA ni estructura semántica**. Dio 9 de 9 con un `<dl>` roto y un
`aria-controls` con espacios presentes.

Antes de commitear una pantalla nueva, pasarle **también** Lighthouse
(`npm i --no-save lighthouse`), sobre `npm run build` + `npm run start` y no sobre
el servidor de desarrollo. Y ninguno de los dos ve los **estados de error de los
formularios**, porque miden la página en reposo: hay que provocarlos y medirlos
aparte.

---

## 6. Trampas conocidas

Cosas que ya nos costaron tiempo una vez.

**`npm run build` falla con `Cannot find module for page: /_error`.** Hay un
`npm run dev` corriendo sobre el mismo `.next`.

**Si el puerto 3000 no se libera, medís el build viejo.** `next start` falla con
`EADDRINUSE` **en su log y no en la terminal**, así que parece que arrancó. El
servidor viejo sirve un manifiesto que apunta a chunks ya sobreescritos:
`ChunkLoadError`, "Application error" en el cliente, y Lighthouse informando un
documento sin `title` ni `lang`. Se lee como código roto. Verificar antes de
medir:

```bash
node -e "require('net').createServer().listen(3000).on('error',()=>{console.log('OCUPADO');process.exit(1)}).on('listening',function(){console.log('libre');this.close()})"
```

**`npm i --no-save X` borra los otros paquetes instalados con `--no-save`.** No
están en `package.json`, así que npm los poda. Instalá todos juntos:
`npm i --no-save puppeteer-core lighthouse`.

**Vite incrusta las variables de entorno al servir el módulo.** Una pestaña
abierta desde antes de agregar una variable se queda con el valor viejo:
`Ctrl+Shift+R`. Nos costó dos intentos en la prueba del ingreso.

**Los mensajes de commit largos rompen en PowerShell.** Escribilos a un archivo y
usá `git commit -F`.

**Git Bash convierte los argumentos que empiezan con `/`.** `ver-portal.mjs
/portal` llega como `C:/Program Files/Git/portal`. Por eso la ruta va sin barra.

**`NEXT_PUBLIC_CIDITUC_LOGIN_URL` va entre comillas en el `.env`.** Termina en
`#/login` y sin comillas el `#` abre un comentario.

**Los nombres de los repos de CiDiTuc están cruzados respecto de los dominios**, y
hay más trampas del ingreso: están todas en
[`docs/ingreso-cidituc.md`](docs/ingreso-cidituc.md) §1 y §3.

**Lo que se escribe desaparece al reiniciar.** No es un bug: son los `Map` en
memoria de §1.

**La auditoría no ve el video del hero.** Mide contraste contra el fondo del DOM.
Ese cálculo se hizo a mano sobre fotogramas reales; está explicado en `Hero.tsx`.
Si alguien baja la opacidad del velo, la auditoría va a seguir diciendo que está
todo bien.

**Chrome headless en Windows no captura por debajo de ~500px.** Por eso las
capturas van por CDP.

**Y una que vale como patrón:** dos veces el instrumento de medición estuvo peor
calibrado que el código medido — la auditoría dando 9 de 9 con dos bugs presentes,
y el diagnóstico del ingreso con el mismo bug que buscaba. Cuando algo no funciona
y el diagnóstico no lo explica, sospechar del diagnóstico primero.

---

## 7. Material fuente

Fuera del repositorio, en la máquina de Lucas:

- `Downloads/Página Web ELCOP.docx` — el pedido original, con la captura del
  prototipo en la última página.
- `Downloads/Web-App-Constructor.zip` — el export del Repl (el código está en
  `artifacts/` y `lib/`).
- `Downloads/logo-elcop-smt-unsta.jpg` — el lockup del que se recortaron los
  logos. **Falta la versión vectorial.**
- `Downloads/saludoMigue.webp` — el sticker original del asistente, 385 KB
  animado. En `public/` están las versiones optimizadas.
- `OneDrive/Escritorio/Notas Laburo/Imagenes para landign elecop/` — las cinco
  fotos reales y los tres videos.
- Los repos de CiDiTuc en `Trabajo/Proyectos Dia/repo para login cidituc/`.
