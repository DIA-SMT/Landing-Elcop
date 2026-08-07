# Dónde quedamos

Punto de retomada del proyecto. Actualizado al **7 de agosto de 2026**.

Los cuatro documentos permanentes explican el *qué* y el *porqué*; este explica
el *dónde estamos parados*.

| Documento | Para qué |
|---|---|
| [`README.md`](README.md) | Cómo levantar el proyecto y dónde está cada cosa |
| [`PLAN.md`](PLAN.md) | Las fases de la segunda etapa, con estimados y riesgos |
| [`ESQUEMA.md`](ESQUEMA.md) | El modelo de contenido y por qué cada decisión |
| [`PENDIENTES.md`](PENDIENTES.md) | Los 31 datos que faltan, con responsable |

---

## 1. Estado

**La web pública está terminada.** Diez secciones en la home, más
`/publicaciones` y `/portal`. Sin CMS, sin base de datos, sin autenticación: el
contenido vive en `content/elcop.ts`.

**El esquema del CMS está escrito pero no conectado.** 18 colecciones y 5
globales en [`cms/`](cms/), tipadas y compilando. No hay `payload.config.ts` ni
base de datos: conectarlo hoy rompería el sitio, y depende de decisiones de
infraestructura que siguen abiertas. Nada de la aplicación importa `cms/`, así
que el bundle no cambia.

Repositorio: `DIA-SMT/Landing-Elcop`, trabajando en la rama **`Lucas`**.
Último commit: `aec370c`.

### Verificado, no supuesto

- Lighthouse: **99 en escritorio, 95 en móvil**, y 100 en Accesibilidad, Buenas
  prácticas y SEO en las tres páginas.
- Accesibilidad medida en 3 páginas × 3 anchos (360, 768, 1440): sin fallas de
  contraste contra el fondo efectivo, sin desborde horizontal, un solo `h1` por
  página, sin saltos de nivel, nada por debajo de 10px, ningún control por
  debajo de 44px.
- El formulario probado de punta a punta, y el menú móvil con teclado.

---

## 2. Decisiones tomadas, con su razón

Las que no se deducen leyendo el código.

| Decisión | Por qué |
|---|---|
| **Payload CMS dentro del mismo Next.js** | Resuelve panel, autenticación, subidas y permisos en un solo proyecto. Un CMS alojado dejaría las postulaciones y el portal en un segundo sistema. |
| **Vercel + Postgres gestionado**, región São Paulo | Elegido por Lucas. Implica que los datos personales salen de la infraestructura municipal: hay que confirmarlo con el municipio. |
| **ISR con revalidación bajo demanda** | Para no perder el 99 de Performance cuando el contenido pase a la base. Va desde el día uno, no como optimización posterior. |
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
proyecto, al final de `app/globals.css`. **Conviene llevarlas también a la
skill `estetica-municipal-smt`**, porque se replican en cada proyecto nuevo:

- `.micro-label` con `slate-400` → 2,56:1
- `.section-kicker` con `municipal-600` → 3,18:1
- `municipal-700` sobre `sand` → 4,39:1 y sobre `municipal-50` → 4,49:1

---

## 3. Bloqueado, y de quién depende

En orden de urgencia.

1. **⚠️ El prototipo de Replit guarda contraseñas en texto plano** y tiene
   credenciales de prueba versionadas. *Verificar si está publicado.* Ítem 31.
2. **Dominio de envío de correo** con SPF, DKIM y DMARC. Es el trámite más
   lento y no arrancó. Depende de sistemas del municipio.
3. **Fecha de apertura de la convocatoria.** Es lo único que le pone calendario
   real a la Fase 2, que es la única con fecha externa.
4. **Aval para alojar datos personales en la nube.** Bloquea la Fase 1.
5. **Consulta a Legales** sobre la validez exigida al Acta Compromiso. Define
   el tamaño de la Fase 4C.
6. **Cómo procesa hoy la coordinación las postulaciones.** No bloquea, pero
   define si el panel les sirve o les estorba.

---

## 4. Lo primero que haría mañana

**Sentarse con la Coordinación Administrativa.** Es lo único de alto valor que
no depende de terceros, y alimenta la fase que sí tiene fecha externa. Sin eso,
el panel de postulaciones se construye a ciegas.

En paralelo, si se destraba el aval de infraestructura, la Fase 1 —conectar
Payload— ya tiene el esquema escrito y es sobre todo cableado.

---

## 5. Cómo verificar que nada se rompió

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

---

## 6. Trampas conocidas

Cosas que ya nos costaron tiempo una vez.

**`npm run build` falla con `Cannot find module for page: /_error`.** Es que
hay un `npm run dev` corriendo sobre el mismo `.next`. Frenalo y volvé a
compilar.

**El puerto 3000 queda tomado** por un `next start` anterior. `Get-Process node
| Stop-Process -Force` lo libera.

**Los mensajes de commit largos rompen en PowerShell.** Los here-strings con
acentos y barras se parsean mal. Escribilos a un archivo y usá `git commit -F`.

**La auditoría no ve el video del hero.** Mide contraste contra el color de
fondo del DOM, y detrás del texto del hero hay un video que no ve. Ese cálculo
se hizo a mano midiendo fotogramas reales; está explicado en `Hero.tsx`. Si
alguien baja la opacidad del velo, la auditoría va a seguir diciendo que está
todo bien y no lo va a estar.

**Chrome headless en Windows no captura por debajo de ~500px de ancho.** Impone
un mínimo de ventana y recorta. Por eso las capturas van por CDP y no por
`--screenshot`.

---

## 7. Material fuente

Fuera del repositorio, en la máquina de Lucas:

- `Downloads/Página Web ELCOP.docx` — el pedido original de ELCOP, con la
  captura del prototipo en la última página.
- `Downloads/Web-App-Constructor.zip` — el export del Repl (104 MB, casi todo
  herramientas del agente; el código está en `artifacts/` y `lib/`).
- `Downloads/logo-elcop-smt-unsta.jpg` — el lockup del que se recortaron los
  logos. **Falta la versión vectorial.**
- `OneDrive/Escritorio/Notas Laburo/Imagenes para landign elecop/` — las cinco
  fotos reales y los tres videos.
