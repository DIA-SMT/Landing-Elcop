-- ============================================================================
-- Migración 0001: las tablas del Portal del Becario.
--
-- Se ejecuta UNA vez, pegándola entera en el SQL Editor de Supabase
-- (Dashboard → SQL Editor → New query → Run).
--
-- Diseño: el navegador NUNCA habla con la base. Todo el acceso pasa por el
-- servidor de Next con la clave secreta, que puentea el RLS. Por eso el RLS se
-- enciende en todas las tablas SIN ninguna política: para la clave pública
-- (publishable/anon) todo está cerrado. No es el mecanismo de permisos de la
-- aplicación —eso vive en las rutas, con nuestra sesión—, es el cinturón de
-- seguridad por si alguna clave termina donde no debía.
-- ============================================================================

-- El padrón: quién puede entrar al portal. CIDITUC autentica; esto autoriza.
-- Reemplaza a la variable de entorno ELCOP_PADRON_PROVISORIO.
create table if not exists becarios (
  documento  text primary key,           -- normalizado: solo dígitos, sin puntos
  nombre     text,                       -- puede faltar; el del ingreso viene de CIDITUC
  cohorte    text not null default '2026',
  creado_en  timestamptz not null default now()
);

-- Quién ve los proyectos de toda la cohorte en /comite.
-- Reemplaza a ELCOP_COMITE_PROVISORIO. Sacar una fila corta el acceso en el
-- próximo pedido: el rol no se guarda en la cookie.
create table if not exists comite (
  documento  text primary key,
  nombre     text,
  creado_en  timestamptz not null default now()
);

-- El proyecto final: una entrega por becario, la versión vigente.
-- "sin-empezar" es la ausencia de fila. Las cinco secciones son columnas y no
-- un JSON a propósito: ochenta proyectos en campos comparables se evalúan y
-- se exportan; ochenta bolsas opacas, no.
create table if not exists entregas (
  becario_id    text primary key,
  estado        text not null check (estado in ('borrador','presentado','observado','aprobado')),
  titulo        text,
  resumen       text,
  problema      text not null default '',
  diagnostico   text not null default '',
  propuesta     text not null default '',
  presupuesto   text not null default '',
  viabilidad    text not null default '',
  presentado_en timestamptz,
  guardada_en   timestamptz not null default now(),
  observaciones text                      -- del comité, cuando el estado es 'observado'
);

-- Consultas de mentoría.
create table if not exists consultas (
  id            text primary key,
  becario_id    text not null,
  asunto        text not null,
  texto         text not null,
  estado        text not null default 'pendiente' check (estado in ('pendiente','respondida','cerrada')),
  creada_en     timestamptz not null default now(),
  sesion_id     text,                     -- null = canal abierto
  sesion        text,                     -- nombre de la sesión, para mostrar sin buscarla
  respuesta     text,
  respondida_en timestamptz
);

create index if not exists consultas_por_becario
  on consultas (becario_id, creada_en desc);

-- Asistencia. encuentro_id referencia al calendario que hoy vive en
-- lib/portal/calendario.ts (el id es la fecha del encuentro, p. ej. 2026-05-14).
-- Queda lista para cuando la coordinación pase el registro real.
create table if not exists asistencias (
  becario_id    text not null,
  encuentro_id  text not null,
  estado        text not null check (estado in ('presente','ausente','justificada')),
  origen        text not null default 'manual' check (origen in ('qr','manual')),
  registrada_en timestamptz not null default now(),
  primary key (becario_id, encuentro_id)
);

-- RLS en modo "nadie lee nada": sin políticas, la clave pública no puede ni
-- hacer select. La clave secreta del servidor lo puentea, que es el único
-- camino previsto.
alter table becarios    enable row level security;
alter table comite      enable row level security;
alter table entregas    enable row level security;
alter table consultas   enable row level security;
alter table asistencias enable row level security;
