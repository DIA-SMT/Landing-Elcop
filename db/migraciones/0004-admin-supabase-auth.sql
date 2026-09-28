-- ============================================================================
-- Migración 0004: el admin pasa a usuarios de Supabase.
--
-- Se ejecuta UNA vez en el SQL Editor de Supabase, igual que las anteriores.
-- Es idempotente: si algo falla a mitad de camino, se corrige y se vuelve a
-- correr entera sin romper nada.
--
-- Sin bloques `do $$ ... $$` a propósito: el editor del panel de Supabase le
-- agrega sus propios comentarios al final del script y su separador de
-- sentencias se traba con las comillas de dólar ("unterminated dollar-quoted
-- string"). Todo lo de acá se resuelve con `if exists` / `if not exists`.
--
-- QUÉ CAMBIA Y QUÉ NO
--
-- Cambia sólo `/admin`. El Portal del Becario y `/comite` siguen entrando con
-- Ciudadano Digital: ahí el padrón es de documentos y la identidad la pone
-- CIDITUC, que es lo correcto para mil postulantes y ochenta becarios.
--
-- El admin es otra cosa: son cinco o seis personas de coordinación, y hacer que
-- cada alta dependa de un trámite con DITEC es más fricción que valor. Desde
-- ahora entran con usuario y contraseña de Supabase Auth.
--
-- Esto REVIERTE, sólo para el admin, la decisión de docs/admin.md §1 ("nadie
-- entra con contraseña nuestra"). Queda asentado ahí, en §1.b, con su costo.
--
-- LO QUE NO CAMBIA: los dos permisos siguen separados y siguen viviendo en la
-- tabla `staff`, así que sacar la fila sigue cortando el acceso en el clic
-- siguiente. El rol no viaja en el token.
-- ============================================================================

-- 1. La identidad nueva. `on delete cascade`: si se borra el usuario de
--    Authentication, su permiso se va con él y no queda una fila huérfana que
--    habilite a nadie.
alter table staff
  add column if not exists usuario_id uuid unique references auth.users(id) on delete cascade;

-- 2. Soltar la clave primaria ANTES de tocar el NOT NULL de `documento`.
--    Postgres no permite quitarle el NOT NULL a una columna que es clave
--    primaria: da "42P16: column is in a primary key". El orden importa.
--    En una segunda corrida esto suelta la primaria nueva, que el paso 4
--    vuelve a crear: por eso el script entero se puede repetir.
alter table staff drop constraint if exists staff_pkey;

-- 3. El documento deja de ser obligatorio: alguien del admin puede no tener uno
--    cargado. La columna se conserva porque sigue siendo útil para identificar
--    la fila y para quien además es becario o parte del comité.
alter table staff alter column documento drop not null;

-- 4. Clave primaria nueva, sobre una columna propia. Se agrega la columna y la
--    restricción por separado porque `add column ... primary key` no admite
--    `if not exists` sobre la restricción.
alter table staff add column if not exists id uuid not null default gen_random_uuid();
alter table staff add constraint staff_pkey primary key (id);

-- 5. Un documento sigue sin poder repetirse cuando está cargado, pero ahora
--    puede faltar: por eso es un índice parcial y no una restricción común.
create unique index if not exists staff_documento_unico
  on staff (documento) where documento is not null;

-- El acceso se resuelve siempre por el usuario de la sesión.
create index if not exists staff_por_usuario on staff (usuario_id);

-- `staff` ya tenía RLS encendido en la 0002. Se deja constancia de que sigue
-- así: sin políticas, la clave publicable no lee ni escribe nada de esta tabla.
-- Los permisos se consultan desde el servidor con la clave secreta.
alter table staff enable row level security;

-- ---------------------------------------------------------------------------
-- CÓMO SE DA DE ALTA A UNA PERSONA
--
-- 1. Panel de Supabase → Authentication → Users → Add user, con su mail
--    institucional y una contraseña provisoria. Marcar "Auto Confirm User"
--    para que no dependa de un mail de confirmación.
-- 2. Copiar el UUID de la columna `User UID`.
-- 3. Ejecutar acá:
--
--      insert into staff (usuario_id, nombre, puede_contenido, puede_postulaciones)
--      values ('<UUID del usuario>', 'Nombre y Apellido', true, false);
--
-- Para una fila que ya existe identificada por documento, alcanza con
-- completarle el usuario en vez de insertar una nueva:
--
--      update staff set usuario_id = '<UUID del usuario>' where documento = '<DNI>';
--
-- Para quitar el acceso se borra la fila de `staff`; el usuario puede seguir
-- existiendo en Authentication sin llegar a ninguna pantalla.
--
-- ⚠ Deshabilitar el registro abierto en Authentication → Providers → Email
--   ("Allow new users to sign up" en off). Este sistema no crea usuarios: si el
--   registro queda abierto, cualquiera se hace una cuenta.
-- ---------------------------------------------------------------------------
