-- ============================================================================
-- Migración 0002: el admin de contenido (Etapa A de docs/admin.md).
--
-- Se ejecuta UNA vez en el SQL Editor de Supabase, igual que la 0001.
-- Mismo diseño: el navegador nunca habla con la base, todo pasa por el
-- servidor con la clave secreta, y el RLS queda encendido sin políticas.
-- ============================================================================

-- Quién puede usar /admin, y para qué. Dos permisos a propósito: ver
-- postulaciones es ver datos personales de más de mil personas; cargar una
-- crónica no. Misma mecánica que `comite`: el permiso se resuelve en cada
-- pedido y sacar la fila corta el acceso en el clic siguiente.
create table if not exists staff (
  documento           text primary key,   -- normalizado: solo dígitos
  nombre              text,
  puede_contenido     boolean not null default false,
  puede_postulaciones boolean not null default false,
  creado_en           timestamptz not null default now()
);

-- Las publicaciones de la landing, editables desde /admin/contenido.
-- Reemplazan al arreglo PUBLICACIONES de content/elcop.ts, que queda como
-- respaldo para desarrollo sin base.
create table if not exists publicaciones (
  slug           text primary key,
  titulo         text not null,
  bajada         text not null,
  fecha          date not null,
  categoria      text not null,
  imagen         text not null,      -- URL pública (Storage) o ruta local (/fotos/...)
  imagen_alt     text not null,      -- obligatorio: sin alt no se guarda
  -- Solo lo publicado se muestra. El borrador no existe para el visitante:
  -- es la regla de "nada provisorio como oficial", ahora en el esquema.
  estado         text not null default 'borrador' check (estado in ('borrador','publicada')),
  creada_en      timestamptz not null default now(),
  actualizada_en timestamptz not null default now()
);

alter table staff         enable row level security;
alter table publicaciones enable row level security;

-- Semilla: las tres crónicas reales que hoy viven en content/elcop.ts, para
-- que el cambio de fuente no borre nada de la página. Fechas y datos del
-- calendario oficial de la cohorte 2026.
insert into publicaciones (slug, titulo, bajada, fecha, categoria, imagen, imagen_alt, estado) values
  ('plenario-agenda-verde',
   'La agenda verde: ciudad sustentable y calidad de vida',
   'Elisabeth Möhle, de Fundar, encabezó el sexto plenario de la cohorte, dedicado a la sustentabilidad y la calidad de vida en la ciudad.',
   '2026-07-04', 'Plenario', '/fotos/cohorte-grupo.jpg',
   'Foto grupal de los becarios de la cohorte 2026 en la UNSTA', 'publicada'),
  ('plenario-analisis-opinion-publica',
   'Análisis de opinión pública, con Diego Reynoso',
   'El investigador del CONICET y doctor por FLACSO-México dictó el segundo plenario de la cohorte, dedicado al análisis de la opinión pública.',
   '2026-05-30', 'Plenario', '/fotos/masterclass-datos.jpg',
   'Clase de la cohorte 2026 con una presentación de datos de opinión pública proyectada', 'publicada'),
  ('plenario-nuevos-medios',
   'Nuevos medios de comunicación en la política',
   'Pablo Pérez Paladino, Malena Dip y Laureano Bielsa compartieron el primer plenario de la cohorte 2026, sobre los nuevos medios en la comunicación política.',
   '2026-05-16', 'Plenario', '/fotos/masterclass-aula.jpg',
   'Encuentro de la cohorte 2026 en el aula magna de la UNSTA', 'publicada')
on conflict (slug) do nothing;

-- El balde de imágenes de las publicaciones. Lectura pública (la landing sirve
-- las fotos directo), escritura solo del servidor: sin políticas sobre
-- storage.objects, la clave pública no puede subir ni borrar nada.
insert into storage.buckets (id, name, public)
values ('publicaciones', 'publicaciones', true)
on conflict (id) do nothing;
