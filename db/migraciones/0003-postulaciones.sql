-- ============================================================================
-- Migración 0003: las postulaciones y los interesados.
--
-- Se ejecuta UNA vez en el SQL Editor de Supabase, igual que la 0001 y la 0002.
-- Mismo diseño: el navegador nunca habla con la base, todo pasa por el servidor
-- con la clave secreta, y el RLS queda encendido sin políticas.
--
-- Hasta acá `app/api/postulacion/route.ts` era un tapón: validaba, logueaba
-- cuántos campos habían llegado y devolvía 200 sin guardar nada. Con 1.091
-- postulaciones en la primera convocatoria, eso era el agujero más caro del
-- proyecto. Estas dos tablas son su destino.
-- ============================================================================

-- Lo que declara quien se postula, más lo que agrega la coordinación.
-- Las columnas siguen a `cms/colecciones/Postulaciones.ts` y a ESQUEMA.md §4.1:
-- los datos declarados son inmutables y lo editable es el estado y las notas.
create table if not exists postulaciones (
  id              uuid primary key default gen_random_uuid(),

  -- Declarado por la persona. El servidor los valida con las mismas reglas que
  -- el formulario (lib/postulacion-validacion.ts), nunca confía en el cliente.
  nombre          text not null,
  dni             text not null,           -- normalizado: solo dígitos
  nacimiento      date not null,
  email           text not null,
  telefono        text not null,
  localidad       text not null,
  ocupacion       text not null,
  nivel_educativo text not null,
  motivacion      text not null,

  -- Agregado por la coordinación desde /admin.
  estado          text not null default 'recibida'
                  check (estado in ('recibida','entrevistada','seleccionada','no-seleccionada')),
  notas_internas  text,                    -- sólo lo ve el staff

  cohorte         text not null,           -- a qué convocatoria corresponde
  recibida_en     timestamptz not null default now(),

  -- Una postulación por persona y por convocatoria. Sin esto, un doble clic o
  -- un reintento por conexión mala duplica la fila, y alguien tiene que
  -- limpiarlo a mano sobre mil filas. El endpoint traduce el choque a un
  -- mensaje claro en vez de a un error.
  unique (dni, cohorte)
);

-- El listado se ordena por fecha y se filtra por estado; el DNI y el mail se
-- buscan de a uno cuando llama una persona concreta.
create index if not exists postulaciones_por_fecha  on postulaciones (recibida_en desc);
create index if not exists postulaciones_por_estado on postulaciones (estado, recibida_en desc);
create index if not exists postulaciones_por_dni    on postulaciones (dni);
create index if not exists postulaciones_por_email  on postulaciones (email);

-- Quiénes dejaron sus datos mientras no había convocatoria abierta.
-- Es deliberadamente mínima: para avisar que abrió la inscripción alcanza con
-- un nombre y un mail. Pedir DNI o fecha de nacimiento para mandar una novedad
-- sería juntar datos personales sin necesitarlos.
create table if not exists interesados (
  id            uuid primary key default gen_random_uuid(),
  nombre        text not null,
  email         text not null,
  telefono      text,                      -- opcional
  origen        text not null default 'web',
  avisado       boolean not null default false,
  registrado_en timestamptz not null default now(),

  -- Dejar el mail dos veces es lo normal cuando no llega respuesta: se guarda
  -- uno solo y el endpoint lo cuenta como registro exitoso igual.
  unique (email)
);

create index if not exists interesados_por_fecha on interesados (registrado_en desc);

-- RLS en modo "nadie lee nada": sin políticas, la clave pública no puede ni
-- hacer select. La clave secreta del servidor lo puentea, que es el único
-- camino previsto. Son datos personales de más de mil personas.
alter table postulaciones enable row level security;
alter table interesados   enable row level security;
