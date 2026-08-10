# Landing pública de ELCOP

> **¿Retomando el proyecto?** Empezá por [`CONTEXTO.md`](CONTEXTO.md): dónde
> quedamos, qué se decidió y por qué, y qué está bloqueado.

Sitio público de la **Escuela de Liderazgo y Comunicación Política**, iniciativa
conjunta de la Municipalidad de San Miguel de Tucumán y la Universidad del
Norte Santo Tomás de Aquino (UNSTA).

## Arrancar

```bash
npm install
```

```bash
npm run dev
```

Otros comandos: `npm run build`, `npm run start`, `npm run typecheck`.

> Si `npm run build` falla con `Cannot find module for page: /_error`, es que
> hay un `npm run dev` corriendo sobre el mismo `.next`. Frenalo y volvé a
> compilar.

### Ver el Portal del Becario

**Si entrás a `/portal` en el navegador vas a ver "Próximamente", y está bien.**
Las pantallas del portal exigen una cookie de sesión que emite el callback de
CIDITUC, y eso no va a pasar hasta que DITEC despliegue el ingreso. Lo mismo vale
para el sitio publicado: ahí "Próximamente" es el estado correcto hasta entonces.

Para verlo en desarrollo, con `npm run dev` corriendo en otra terminal:

```bash
npm run portal
```

Abre una ventana con la cookie ya puesta. Para una pantalla puntual:

```bash
node herramientas/ver-portal.mjs portal/proyecto
```

La ruta va **sin barra inicial**: Git Bash convierte `/portal` en una ruta de
Windows. Acepta `portal/clases`, `portal/mentorias`, `portal/proyecto`.

Si preferís usar tu navegador de siempre, `npm run sesion` imprime la cookie para
pegarla en DevTools → Application → Cookies.

Para ver datos en vez de pantallas vacías, `PORTAL_DATOS_DEMO=true` en
`.env.local`. Vacío es el estado correcto mientras no haya base, y es lo que un
becario ve el primer día.

La cookie se firma desde afuera con `ELCOP_SESSION_SECRET`: **no hay ninguna
ruta de la aplicación que emita sesiones de prueba**, para no dejar una puerta
de servicio en un sistema que va a custodiar datos personales.

### Verificar accesibilidad

```bash
npm run auditar
```

```bash
npm run auditar:portal
```

El primero recorre las páginas públicas; el segundo, las de adentro del portal,
con sesión. Los dos necesitan el servidor corriendo y
`npm i --no-save puppeteer-core`, y devuelven código distinto de cero si algo
falla, así que sirven en un hook o en integración continua.

**El contraste se mide contra el fondo efectivo**, subiendo por el árbol hasta
un color opaco. Dos cosas que la auditoría no ve: el texto sobre el video del
hero, y los estados de error de los formularios, porque recorre la página en
reposo. Ésos se miden a mano.

## Cómo se edita el contenido

**Todo el contenido vive en [`content/elcop.ts`](content/elcop.ts).** Cambiar
una fecha, sumar un docente o corregir un texto es editar un objeto de ese
archivo; los componentes no tienen texto propio.

Convención: cualquier dato provisorio, estimado o de ejemplo lleva
`// TODO: confirmar con ELCOP` en la línea que lo define, y la interfaz lo
muestra marcado como tal. Ningún dato de demostración se presenta como oficial.

El listado de lo que falta pedirle a ELCOP está en
[`PENDIENTES.md`](PENDIENTES.md).

## Sistema de diseño

`tailwind.config.ts` y la primera parte de `app/globals.css` son copia del
sistema de diseño municipal de SMT y **no se editan** para acomodar una
pantalla: son los tokens compartidos con el resto de los productos del
municipio.

Lo propio de este proyecto está al final de `globals.css`, en un bloque
marcado, y se limita a lo que el sistema no cubre:

- Controles de formulario largo (los `.filter-*` del sistema están pensados
  para filtros, no para un formulario de postulación).
- El patrón de revelado al hacer scroll (`.reveal`).
- La animación de salida del menú móvil.
- Tres correcciones de contraste sobre clases del sistema, explicadas en el
  propio archivo. **Conviene llevarlas también al sistema compartido.**

Las fuentes (Poppins para títulos, Inter para el resto) se cargan con
`next/font` en `app/layout.tsx`, no por CSS.

## Estructura

```
app/
  layout.tsx              fuentes, header, footer, metadatos
  page.tsx                home: las 9 secciones en orden
  publicaciones/          listado de notas
  portal/                 Portal del Becario: panel, clases, mentorías, proyecto
  auth/cidituc/           ingreso y salida con Ciudadano Digital
  api/postulacion/        recepción del formulario (hoy no persiste)
  api/portal/consultas/   consultas de mentoría (hoy en memoria)
  api/portal/entrega/     proyecto final (hoy en memoria)
components/
  layout/                 Header (con menú móvil) y Footer
  home/                   una sección de la home por archivo
  portal/                 marco, panel y pantallas del portal
  ui/                     Reveal y ContadorAnimado
content/elcop.ts          todo el contenido, tipado
lib/
  cidituc.ts              firma y verificación de la sesión
  padron.ts               quién tiene derecho a entrar (provisorio)
  portal/                 tipos, cálculos y datos del portal
herramientas/             auditoría de accesibilidad y sesión de desarrollo
```

## Alcance

La web pública está terminada. El **Portal del Becario** está en construcción:
el ingreso con Ciudadano Digital funciona, y de sus cinco secciones están hechas
cuatro —panel, Mis clases, Mentorías y Proyecto final—. Falta Mi beca, que se
muestra en la navegación marcada como "Pronto" y depende de una definición de
Legales.

Lo que el portal todavía no tiene es **persistencia**: no hay base de datos, así
que las asistencias y los materiales salen de una capa provisoria y las
consultas de mentoría se guardan en memoria del proceso. Está anotado en
[`PENDIENTES.md`](PENDIENTES.md) §2.

La segunda etapa —sitio auto-gestionable, formulario de inscripción real y
entrega del trabajo final— está planificada en [`PLAN.md`](PLAN.md). Implica
sumar CMS y base de datos, que es lo que sigue pendiente.

## Convenciones

- Todo en español: interfaz, comentarios del código y mensajes de commit.
- Accesibilidad: contraste mínimo 4.5:1, foco visible en todos los controles,
  objetivos táctiles de 44px, piso tipográfico de 10px y navegación completa
  por teclado. Está verificado sobre las tres páginas a 360, 768 y 1440px.
- Movimiento: sólo se animan `transform` y `opacity`, y se respeta
  `prefers-reduced-motion`, que ya está resuelto globalmente.
- Sin `window.confirm` ni `alert`.
