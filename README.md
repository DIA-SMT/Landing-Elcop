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
  portal/                 placeholder del Portal del Becario
  api/postulacion/        recepción del formulario (hoy no persiste)
components/
  layout/                 Header (con menú móvil) y Footer
  home/                   una sección de la home por archivo
  ui/                     Reveal y ContadorAnimado
content/elcop.ts          todo el contenido, tipado
```

## Alcance

Esta iteración cubre **sólo la web pública**. El Portal del Becario (login,
dashboard, asistencia, repositorio de clases, carga del proyecto final) queda
fuera: `/portal` es una página con "Próximamente" y no hay autenticación
simulada.

La segunda etapa —sitio auto-gestionable, formulario de inscripción real y
entrega del trabajo final— está planificada en [`PLAN.md`](PLAN.md). Implica
sumar CMS, base de datos y autenticación, que es justamente lo que esta
iteración dejó afuera.

## Convenciones

- Todo en español: interfaz, comentarios del código y mensajes de commit.
- Accesibilidad: contraste mínimo 4.5:1, foco visible en todos los controles,
  objetivos táctiles de 44px, piso tipográfico de 10px y navegación completa
  por teclado. Está verificado sobre las tres páginas a 360, 768 y 1440px.
- Movimiento: sólo se animan `transform` y `opacity`, y se respeta
  `prefers-reduced-motion`, que ya está resuelto globalmente.
- Sin `window.confirm` ni `alert`.
