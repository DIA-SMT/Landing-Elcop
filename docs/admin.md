# El admin: postulaciones y contenido autogestionable

Único documento del área de administración. Es la Fase 2 + Fase 3 de
[`PLAN.md`](../PLAN.md), aterrizada con las decisiones del 8/9/2026 y con lo
que el proyecto ya tiene construido.

**Estado: Etapa A construida y verificada (8/9/2026)** — publicaciones
editables en `/admin/contenido`, con la migración `0002` aplicada y el circuito
crear → publicar → landing → borrar probado contra la base real. La Etapa B
sigue bloqueada por la reunión con coordinación (ítem 16).

---

## 1. Decisiones tomadas (8/9/2026, con Lucas)

**Admin propio, sin CMS externo.** El plan de enero decía Payload; en agosto se
eligió Supabase y se construyó todo el patrón que un admin necesita: sesión
CIDITUC, roles por tabla con efecto inmediato, RLS cerrado, revalidación.
Payload hoy agregaría una segunda autenticación (contraseñas nuevas que alguien
olvida), un segundo ORM y una superficie enorme para un equipo chico. El admin
es parte del mismo Next, con las mismas piezas.

**Contenido primero, postulaciones segundo.** El contenido no tiene ningún
bloqueante externo. El panel de postulaciones sí, y dos veces: sin la reunión
con coordinación (ítem 16) se diseña a ciegas, y sin el aviso de privacidad
(ítem 18) el formulario real no se puede publicar. No hay fecha de próxima
convocatoria (ítem 14), así que no hay apuro que justifique construir a ciegas.

**Dos permisos, no un rol "admin".** Ver postulaciones es ver datos personales
de más de mil personas; cargar una crónica no. Quien edita contenido no
necesita ver DNIs. La tabla `staff` lleva las dos capacidades por separado.

**Nadie entra con contraseña nuestra.** Coordinación entra con su cuenta de
Ciudadano Digital, igual que los becarios y el comité. El sistema no guarda ni
una contraseña propia, y esa propiedad no se negocia.

## 2. Arquitectura

```
/admin                      sesión CIDITUC + tabla staff (sin rol → 404, como /comite)
  /admin/contenido          quien tenga puede_contenido      ← Etapa A
  /admin/postulaciones      quien tenga puede_postulaciones  ← Etapa B
```

Tabla `staff`: `documento` (pk), `nombre`, `puede_postulaciones`,
`puede_contenido`, `creado_en`. Misma mecánica que `comite`: el permiso se
resuelve en cada pedido, sacar la fila corta el acceso en el clic siguiente, y
nada del rol viaja en la cookie.

## 3. Etapa A — Contenido autogestionable

Empezando por **publicaciones**, que es lo que más cambia y lo que coordinación
pidió primero. Después, con el mismo molde: referentes, contacto/redes y fechas
de cohorte. Los ejes, lo institucional y el equipo quedan en código: cambian
una vez por cohorte y no justifican pantalla.

- Tabla `publicaciones` espejo del tipo actual (`slug`, `titulo`, `bajada`,
  `fecha`, `categoria`, `imagen`, `imagen_alt`) más `estado`
  (`borrador` | `publicada`) y las fechas de auditoría.
- **La regla de siempre sobrevive en el esquema**: sólo `publicada` se muestra;
  el borrador no existe para el visitante. Nada provisorio como oficial.
- Fotos en Supabase Storage, con **texto alternativo obligatorio** — sin alt no
  se puede guardar, no es un campo opcional que nadie llena.
- La landing lee de la base cuando está configurada (con `content/elcop.ts` de
  semilla y respaldo, mismo patrón que el padrón) y se revalida al guardar:
  coordinación aprieta "Publicar" y el sitio se actualiza solo, sin deploy.
- El asistente del chat hereda el contenido nuevo gratis: su contexto se arma
  del mismo lugar del que lee la página.

Pendiente de decidir con coordinación cuando se pueda: si las notas necesitan
**cuerpo** (hoy son tarjetas con bajada, sin página propia). Se diseña la tabla
con el hueco pero no se construye el editor hasta que alguien lo pida.

## 4. Etapa B — Postulaciones (bloqueada, y por quién)

El esquema ya está en [`ESQUEMA.md`](../ESQUEMA.md) §4.1 y no cambia: se crean
sólo desde el formulario público, los datos personales son de sólo lectura en
el panel, estados `recibida → entrevistada → seleccionada / no seleccionada`,
notas internas, búsqueda, filtros y CSV.

Lo que se suma al diseño original:

- **"Pasar seleccionadas al padrón"**: un botón que inserta las seleccionadas
  en `becarios`. Cierra el circuito completo — de postularse a entrar al portal
  sin una sola planilla en el medio.
- El formulario público deja de terminar en `console.info`
  (`app/api/postulacion/route.ts`, aislado para esto desde enero) y pasa a la
  tabla, con miel para bots y límite de frecuencia (patrón del chat).
- El email de confirmación queda **diseñado como hueco**: depende del dominio
  de correo (ítem 20, el trámite más lento del municipio — conviene arrancarlo
  ya aunque la etapa espere).

| Bloqueante de la Etapa B | Ítem | Estado |
|---|---|---|
| Reunión con Coordinación Administrativa | 16 | Preparada en [`reunion-coordinacion.md`](reunion-coordinacion.md), difícil de agendar por ahora |
| Aviso de privacidad / responsable de datos | 18 | Sin novedades — bloquea PUBLICAR el formulario, no construirlo |
| Dominio de email (SPF/DKIM/DMARC) | 20 | Sin novedades — sólo bloquea los emails |
| Fecha de la convocatoria | 14 | Sin fecha — por eso no hay apuro |

## 5. Qué NO entra en este plan

- Jurado y puntaje del proyecto final (ítem 23): otra decisión, otra pantalla.
- Edición de ejes, institucional y equipo: viven en código a propósito.
- Emails transaccionales: esperan el ítem 20.
- Historial de versiones del contenido: la tabla guarda la versión vigente,
  igual que las entregas. Si algún día duele, se agrega.

## 6. Cómo se verifica (criterios de hecho)

- Sin fila en `staff` → `/admin` es 404, también para becarios y comité.
- Con `puede_contenido` pero sin `puede_postulaciones` → `/admin/postulaciones`
  es 404 (y viceversa).
- Publicar una nota actualiza la landing sin deploy; despublicarla la saca.
- Una imagen sin texto alternativo no se puede guardar.
- Las auditorías (con la vara nueva: HTTP 200 obligatorio) cubren `/admin`.
- La base caída degrada con mensaje, nunca con un 500 — patrón del ingreso.
