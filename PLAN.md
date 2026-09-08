# Plan — de landing a plataforma

Este documento parte de tres definiciones que llegaron después de la primera
iteración:

1. El sitio tiene que ser **auto-gestionable** por ELCOP.
2. Nos van a pasar **el formulario de inscripción** que usaron en la primera
   convocatoria.
3. Tiene que haber un **segmento donde los becarios entreguen el trabajo final**.

---

## 1. Qué cambia

La primera iteración se construyó sin CMS, sin base de datos y sin
autenticación, porque así estaba pedido. **Las tres definiciones nuevas
necesitan exactamente esas tres cosas.**

| Definición | Lo que arrastra |
|---|---|
| Auto-gestionable | Panel de edición de contenido |
| Formulario de inscripción | Base de datos + panel para leer las postulaciones |
| Entrega del trabajo final | Login de becarios + almacenamiento de archivos |

Deja de ser un sitio estático y pasa a ser una aplicación con datos propios.
No es un problema —era previsible— pero conviene decirlo antes de empezar y no
a mitad de camino.

**La buena noticia:** el panel de ELCOP y el Portal del Becario comparten el
mismo cimiento (autenticación, base de datos, permisos). Se construye una vez y
sirve a los dos. Hacer los dos cuesta bastante menos que el doble de hacer uno.

**La otra buena noticia:** todo el contenido ya vive en un módulo tipado
(`content/elcop.ts`). Los tipos que están ahí —`Indicador`, `GrupoEquipo`,
`EjeFormativo`, `Referente`, `Publicacion`— se convierten casi uno a uno en
colecciones del CMS. La migración es mecánica, no es reescribir.

---

## 2. Decisiones tomadas

| Tema | Decisión |
|---|---|
| Alcance de la autogestión | Todo el contenido público, priorizando lo que cambia seguido. Más un panel para ver y gestionar postulaciones. |
| Formulario de inscripción | Se toma el de la 1ª convocatoria (probablemente un Google Form) **como especificación de campos**, y se implementa dentro del sitio. Ver §4. |
| Entrega del trabajo final | Subida de archivo con login del becario. |
| Infraestructura | Nube (Vercel) + base de datos gestionada. |

---

## 3. Stack propuesto

### Recomendación: Payload CMS sobre el mismo Next.js

Payload (versión 3 en adelante — hay que verificar cuál es la actual al
arrancar) corre **dentro** de la aplicación Next.js que ya existe. En un solo
proyecto y un solo deploy resuelve:

- panel de administración generado a partir del esquema,
- autenticación con roles (staff de ELCOP / becario),
- subida de archivos con adaptador de almacenamiento,
- control de acceso por colección y por campo.

Es la opción que menos piezas móviles deja. La alternativa realista es un CMS
alojado (Sanity, Contentful) para el contenido, pero entonces las postulaciones,
las cuentas de becarios y las entregas necesitan **un segundo sistema aparte**:
dos paneles, dos lugares donde mirar, dos cosas que mantener.

Si Payload resulta demasiado pesado para el equipo, el plan B es Prisma +
Auth.js + un panel hecho a mano. Da más control y ningún framework que aprender,
pero hay que construir toda la interfaz de administración, que es justamente lo
que Payload regala.

### Piezas

| Pieza | Propuesta | Nota |
|---|---|---|
| Hosting | Vercel | El proyecto ya es Next.js; el deploy es directo. |
| Base de datos | Postgres gestionado (Neon o Vercel Postgres) | Elegir región **São Paulo** por latencia y por dónde quedan los datos personales. |
| Archivos | Vercel Blob o S3 | Para los trabajos finales. |
| Email transaccional | Resend o similar | **Ver §6: es el bloqueante lento.** |

Alternativa de un solo proveedor: Supabase cubre Postgres + almacenamiento. Su
módulo de autenticación quedaría de más, porque Payload trae la suya.

### Lo que no hay que perder

El sitio hoy da **100 en Performance en escritorio y 100 en Accesibilidad en las
tres páginas**. Mover el contenido a una base de datos puede tirar eso abajo si
cada visita consulta la base.

La forma de conservarlo es **ISR con revalidación bajo demanda**: las páginas se
siguen sirviendo prerenderizadas, y un hook de Payload dispara la regeneración
cuando alguien publica un cambio. El visitante ve HTML estático; ELCOP ve su
cambio en segundos. Esto va en el plan desde el día uno, no como optimización
posterior.

---

## 4. El formulario de inscripción: replicarlo, no enlazarlo

Cuando llegue el formulario de la primera convocatoria, la recomendación es
usarlo **como especificación de qué preguntar**, y no enlazar el Google Form
desde el sitio.

**Por qué:**

- Se pidió un panel para *ver y gestionar postulaciones*. Si el formulario es
  de Google, las respuestas viven en una planilla de Google y el panel no las
  puede mostrar sin sincronizarlas — trabajo extra y una fuente de verdad
  duplicada.
- El formulario del sitio ya está construido, validado y probado contra las
  reglas de accesibilidad municipales. El de Google no cumple varias.
- Evita que el postulante salte a un dominio de Google en la mitad del proceso.

**El costo:** si la coordinación ya tiene su forma de trabajar sobre la planilla
(filtrar, puntuar, marcar), sacárselas es fricción real. Se compensa con
exportación a CSV desde el panel, y —si hace falta— con una copia automática a
una planilla de Google. Eso se decide cuando veamos cómo trabajan hoy.

**Lo que hay que pedir:** el enlace al formulario **y** la planilla de
respuestas de la primera convocatoria. La planilla dice qué campos se usaron de
verdad, cuáles quedaron vacíos y qué volumen manejamos.

---

## 5. Fases

El orden lo manda el calendario, no la prolijidad técnica: primero lo que tiene
fecha externa.

### Fase 0 — Definiciones y marco legal
*No se escribe código. Es lo que puede frenar todo lo demás.*

- Responsable del tratamiento de datos personales y aviso de privacidad.
  Pasamos a custodiar DNI, fecha de nacimiento y teléfono de más de mil
  personas.
- Dominio definitivo y quién administra el DNS.
- Dominio de envío de emails verificado (§6).
- Fecha de apertura de la próxima convocatoria. **Es la fecha que ordena todo
  el resto del plan.**

### Fase 1 — Cimiento
*No entrega nada visible. Es la base de las tres fases siguientes.*

- Payload integrado en el proyecto actual.
- Postgres y almacenamiento de archivos conectados.
- Deploy en Vercel, con entornos de prueba y producción separados.
- Autenticación y roles del staff de ELCOP.
- ISR con revalidación bajo demanda funcionando de punta a punta.

Estimado orientativo: **1 a 2 semanas.**

> **Actualización 8/9/2026:** las fases 2 y 3 se replanificaron sobre lo que el
> proyecto ya tiene (Supabase + sesión CIDITUC + roles por tabla), **sin
> Payload**, y con el contenido antes que las postulaciones. El plan vigente de
> las dos está en [`docs/admin.md`](docs/admin.md); lo de abajo queda como
> referencia del alcance original.

### Fase 2 — Postulaciones
*Tiene fecha externa: la apertura de la convocatoria.*

- Formulario real con los campos de la 1ª convocatoria.
- Guardado en base de datos (reemplaza el `console.info` de
  `app/api/postulacion/route.ts`, que ya está aislado para esto).
- Protección contra envíos automatizados y límite de frecuencia.
- Email de confirmación al postulante.
- Panel de postulaciones: listado, búsqueda, filtros, estados
  (recibida / entrevistada / seleccionada / no seleccionada), exportación a CSV.

Estimado orientativo: **2 a 3 semanas.**

### Fase 3 — Contenido auto-gestionable
*Sin fecha externa. Puede adelantarse a la Fase 2 si la convocatoria está lejos.*

Migración de `content/elcop.ts` a colecciones editables. Orden sugerido, de más
a menos frecuente:

1. Publicaciones, referentes de masterclass, fechas de cohorte, datos de
   contacto y redes.
2. Indicadores, equipo, FAQ.
3. Ejes de la diplomatura, textos institucionales.

**Datos de la ciudad.** El documento pide que Publicaciones tenga "notas, fotos
y datos de la ciudad". Se resuelve como una colección más: indicadores de San
Miguel de Tucumán que carga la coordinación a mano.

Dos reglas para esa colección, que no son opcionales en un sitio oficial:
**cada indicador lleva fuente y fecha de corte visibles**, y los que sean
estimados van marcados como tales. Un número sin fuente en un sitio del
municipio es un problema, no un dato.

Los componentes casi no cambian: conservan los mismos tipos y solo cambian de
dónde leen. Lo que sí hay que hacer bien es la carga de imágenes con recorte y
texto alternativo obligatorio, porque de ahí salen las fotos del equipo y de las
clases que hoy son marcadores de posición.

Estimado orientativo: **2 a 3 semanas** para el grupo 1, más **1 a 2 semanas**
para el resto.

### Fase 4 — Portal del Becario
*Fecha externa: el cierre de la cursada, unos 4 meses después de la Fase 2.*

El alcance salió del documento `Página Web ELCOP.docx` y del prototipo en
Replit. Es bastante más de lo que suponíamos, así que va partido en tres.

> **Decisión sobre el prototipo: se rehace, no se migra — pero se le toma el
> modelo de datos.**
>
> El prototipo es una aplicación completa, no un mockup: monorepo pnpm con
> Postgres y Drizzle, API en Express 5, frontend React + Vite con shadcn/ui, y
> una especificación OpenAPI como fuente de verdad con generación de tipos.
>
> Migrarlo implicaría mantener **dos frontends** —su SPA de Vite y nuestro
> Next.js— y **dos sistemas de diseño**. Reestilar noventa componentes de
> shadcn al sistema municipal es más trabajo que rehacer las ocho pantallas del
> portal.
>
> Su modelo de datos, en cambio, es valioso y está informado por conversaciones
> con ELCOP que nosotros no tuvimos. De ahí salieron tres cambios al esquema:
> la jerarquía de tres niveles (eje → módulo → encuentro), las masterclass como
> encuentros marcados en vez de una lista aparte, y el proyecto final como
> formulario estructurado en vez de un archivo suelto.
>
> **No se reutiliza nada de su capa de autenticación.** Ver el ítem 31 de
> `PENDIENTES.md`.

#### 4A — Base del portal y entrega del proyecto

- Alta de cuentas **derivada de las postulaciones marcadas como seleccionadas**.
  No hay registro público: el conjunto de usuarios es cerrado, y eso es una
  propiedad de seguridad que conviene conservar.
- Invitación por email con enlace para definir contraseña.
- Dashboard: encabezado de bienvenida y estado académico (condición regular,
  proyecto final pendiente o entregado, consultas de mentoría abiertas).
- **Carga del Proyecto Final** en `/portal/proyecto`: subida de archivo con
  formato y tamaño acotados, fecha límite validada en el servidor y posibilidad
  de reemplazar antes del cierre.
- Vista del comité académico: listado de entregas, descarga, estado.

Estimado orientativo: **3 a 4 semanas.**

#### 4B — Cursada: asistencia, clases y mentorías

- **Calendario de encuentros.** Es la pieza que faltaba en el plan anterior:
  sin un modelo de clases con fecha y módulo no hay "Próxima sesión", ni
  "Clases recientes", ni de qué colgar la asistencia.
- **Asistencia por QR con autoregistro.** El becario marca su propia asistencia
  al entrar al aula. Ver §6: el QR tiene que rotar, si no se saca una foto y se
  manda por WhatsApp. Incluye corrección manual por la coordinación, porque
  siempre hay alguien que se queda sin batería.
- **Termómetro de Regularidad**: porcentaje acumulado contra el piso del 75%.
- **Repositorio de clases** por módulo, con archivos descargables (presentaciones,
  lecturas y bibliografía).
- **Formulario de Consultas para Mentorías**: el becario envía dudas técnicas
  antes de las sesiones virtuales, y la coordinación las ve agrupadas.

Estimado orientativo: **4 a 6 semanas.**

#### 4C — Contrato de Beca y Acta Compromiso

Personalizado por becario y con aceptación registrada. Es la parte con peso
legal, no una pantalla más:

- Generación de un PDF por persona con sus datos.
- Aceptación desde el portal, con registro de fecha, hora y quién aceptó.
- Descarga del documento aceptado.

**Antes de construirlo hay que definir con Legales qué valor se le exige.** Un
"acepto" con clic es firma electrónica; la firma digital de la Ley 25.506 es
otra cosa y necesita certificado. No es una decisión de desarrollo.

Estimado orientativo: **2 a 3 semanas**, más lo que tarde la definición legal.

> Los estimados son para **ordenar el trabajo**, no para comprometer entregas.
> Se firman cuando estén resueltos los puntos de la Fase 0.

---

## 6. Riesgos y bloqueantes

**El correo es el bloqueante lento.** Confirmaciones de postulación e
invitaciones a becarios necesitan un servicio de email transaccional con el
dominio verificado (registros SPF, DKIM y DMARC). En un municipio eso suele
depender de un área de sistemas distinta y puede tardar semanas. **Conviene
arrancarlo en la Fase 0, no cuando haga falta.**

**No sabemos cuándo abre la convocatoria.** Es lo único que le da fecha a la
Fase 2 y hoy es una incógnita. Mientras no esté, cualquier cronograma es
provisorio.

**"Auto-gestionable" es la palabra que más veces termina mal.** El patrón
conocido: se construye un panel que edita todo, nadie lo aprende, a los seis
meses el contenido está viejo y llaman igual al desarrollador. Mitigaciones
concretas: empezar por lo que cambia seguido, sentarse con quien va a usarlo
antes de diseñar las pantallas, y dejar un instructivo corto en video en vez de
un manual que nadie abre.

**Datos personales en la nube.** La decisión de ir a Vercel + base gestionada
implica que los datos salen de la infraestructura municipal. Hay que confirmar
que eso sea aceptable para el municipio antes de la Fase 1, no después.

**El trabajo final es una competencia.** Si hay jurado y puntaje, la vista del
comité necesita más que descargar archivos. Hay que definirlo antes de la
Fase 4.

**Un QR fijo de asistencia no sirve.** Si el código es siempre el mismo, el
primero que llega le saca una foto y la manda al grupo, y la asistencia deja de
medir nada. La forma que funciona es un **código que rota cada 30 segundos**,
proyectado en el aula, con la ventana de registro abierta sólo durante la
clase. Conviene decidirlo ahora y no cuando ya esté construido.

**El contrato firmado es un instrumento legal.** Aceptar con un clic no equivale
a firmar. Si ELCOP necesita que el Acta Compromiso sea oponible, hay que
involucrar a Legales antes de la Fase 4C, no después.

---

## 7. Lo que hay que conseguir, y de quién

| Qué | De quién | Cuándo se necesita |
|---|---|---|
| Fecha de apertura de la convocatoria | ELCOP | Ya — ordena todo el plan |
| Formulario de la 1ª convocatoria + planilla de respuestas | ELCOP | Antes de la Fase 2 |
| Cómo trabaja hoy la coordinación con las postulaciones | Coordinación Administrativa | Antes de diseñar el panel |
| Quiénes usan el panel y con qué permisos | ELCOP | Fase 1 |
| Responsable del tratamiento de datos y aviso de privacidad | Municipalidad / Legales | Fase 0, bloqueante |
| Dominio definitivo y acceso al DNS | Municipalidad | Fase 0 |
| Dominio de envío de emails verificado | Sistemas del municipio | Fase 0, es lo más lento |
| Aval para alojar datos personales en la nube | Municipalidad | Antes de la Fase 1 |
| Formato, tamaño y fecha límite del trabajo final | ELCOP | Antes de la Fase 4 |
| Si hay jurado y puntaje en el trabajo final | ELCOP | Antes de la Fase 4 |
| Acceso al prototipo de Replit: URL publicada o el código exportado | Félix Agustín Paz | Antes de dimensionar la Fase 4 |
| Qué indicadores de la ciudad se publican, con su fuente | ELCOP | Fase 3 |
| Calendario de encuentros de la cohorte | ELCOP | Fase 4B |
| Qué validez legal se le exige al Acta Compromiso | Legales | Antes de la Fase 4C |

El resto de lo que falta —contenidos, fotos, logos en vectorial— sigue en
[`PENDIENTES.md`](PENDIENTES.md).

---

## 8. Qué se puede hacer ya, sin esperar nada

Mientras se destraban los puntos de la Fase 0, hay trabajo que no depende de
nadie:

- ~~Levantar el proyecto en Vercel~~ — **lo toma Lucas.** Requiere que el
  proyecto esté en un repositorio git, que todavía no lo está.
- ~~Armar el esquema de colecciones a partir de los tipos de
  `content/elcop.ts`~~ — **hecho:** el diseño en [`ESQUEMA.md`](ESQUEMA.md) y
  el código en [`cms/`](cms/), que ya compila. Falta conectarlo, que es Fase 1.
- Sentarse con la Coordinación Administrativa a ver cómo procesan hoy las
  postulaciones. Es lo que define si el panel les sirve o les estorba.
