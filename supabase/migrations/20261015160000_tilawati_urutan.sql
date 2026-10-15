-- Posisi tilawati = entri yang terakhir DICATAT, bukan bertanggal terbaru: +N untuk kegiatan lampau
-- yang diisi belakangan (tanggal kegiatan) tidak boleh menimpa koreksi yang dicatat sesudahnya.
alter table public.capaian_tilawati add column no_urut bigint generated always as identity;

create or replace view public.v_posisi_tilawati with (security_invoker = true) as
select x.generus_id, x.jilid, x.halaman, x.tanggal, j.total_halaman
from (
  select distinct on (generus_id) generus_id, kelompok_id, jilid, halaman, tanggal
  from public.capaian_tilawati
  order by generus_id, no_urut desc
) x
left join public.jilid_tilawati j on j.kelompok_id = x.kelompok_id and j.jilid = x.jilid;
