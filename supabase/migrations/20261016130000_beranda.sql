-- Beranda (ringkasan): kehadiran per hari dalam rentang tanggal. Invoker: RLS presensi membatasi
-- guru ke kelasnya; admin & pengurus melihat semua. Hari tanpa kegiatan tetap muncul (total 0).
create function public.fn_kehadiran_harian(p_dari date, p_sampai date)
returns table (tanggal date, hadir integer, total integer, persen integer)
language sql stable
set search_path = ''
as $$
  select
    h.tanggal::date,
    count(p.id) filter (where p.status in ('hadir', 'terlambat'))::integer,
    count(p.id)::integer,
    case when count(p.id) = 0 then null
         else round(100.0 * count(p.id) filter (where p.status in ('hadir', 'terlambat')) / count(p.id))::integer end
  from generate_series(p_dari, p_sampai, interval '1 day') as h(tanggal)
  left join public.kegiatan k on k.tanggal = h.tanggal::date and k.status <> 'batal'
  left join public.presensi p on p.kegiatan_id = k.id
  group by h.tanggal
  order by h.tanggal
$$;
