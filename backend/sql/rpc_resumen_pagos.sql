-- Totales de pagos por tipo y método para un rango de fechas / turno.
-- Lo usa GET /api/pagos/resumen (resumen de la pantalla de pagos y cierre de caja).
-- Ejecutar en Supabase → SQL Editor.
create or replace function public.rpc_resumen_pagos(
  _desde date default null,
  _hasta date default null,
  _turno text default null
)
returns table (tipo text, metodo_de_pago text, total numeric, cantidad bigint)
language sql
stable
as $$
  select
    coalesce(p.tipo, '')           as tipo,
    coalesce(p.metodo_de_pago, '') as metodo_de_pago,
    coalesce(sum(p.monto), 0)      as total,
    count(*)                       as cantidad
  from public.pagos p
  where (_desde is null or p.fecha_de_pago >= _desde)
    and (_hasta is null or p.fecha_de_pago <= _hasta)
    and (_turno is null or p.turno = _turno)
  group by 1, 2;
$$;
