-- Filter kehadiran Beranda per jenjang/kelas: dihitung menurut kelas ANAK (bukan kelas kegiatan),
-- agar kegiatan gabungan terbagi benar. p_kelas_ids null = semua kelas yang terlihat.
drop function public.fn_kehadiran_harian(date, date);

create function public.fn_kehadiran_harian(p_dari date, p_sampai date, p_kelas_ids uuid[] default null)
returns table (tanggal date, hadir integer, total integer, persen integer)
language sql stable
set search_path = ''
as $$
  with p as (
    select k.tanggal, pr.status
    from public.kegiatan k
    join public.presensi pr on pr.kegiatan_id = k.id
    join public.generus g on g.id = pr.generus_id
    where k.status <> 'batal'
      and k.tanggal between p_dari and p_sampai
      and (p_kelas_ids is null or g.kelas_id = any (p_kelas_ids))
  )
  select
    h.tanggal::date,
    count(p.status) filter (where p.status in ('hadir', 'terlambat'))::integer,
    count(p.status)::integer,
    case when count(p.status) = 0 then null
         else round(100.0 * count(p.status) filter (where p.status in ('hadir', 'terlambat')) / count(p.status))::integer end
  from generate_series(p_dari, p_sampai, interval '1 day') as h(tanggal)
  left join p on p.tanggal = h.tanggal::date
  group by h.tanggal
  order by h.tanggal
$$;
