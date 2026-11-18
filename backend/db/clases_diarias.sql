-- Tabla para las clases diarias ("Registrar presentes" de recepción), que antes vivían en la hoja
-- ClasesDiarias de Google Sheets. La hoja está vacía (solo encabezado), así que no hay datos para migrar.
-- Correr una sola vez en el SQL Editor de Supabase. Es aditivo: no toca ninguna tabla existente.

create table if not exists public.clases_diarias (
  id bigint generated always as identity primary key,
  fecha date not null,
  tipo_clase text not null,
  cantidad integer not null,
  responsable text,
  created_at timestamptz not null default now()
);

create index if not exists clases_diarias_fecha_idx on public.clases_diarias (fecha);

-- El backend usa la service role key, que no pasa por RLS. Activarlo sin políticas deja la tabla
-- cerrada para las keys públicas (anon), igual que corresponde.
alter table public.clases_diarias enable row level security;
