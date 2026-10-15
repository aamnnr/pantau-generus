-- Tahap 6: progres per periode (bulan / periode target / semester / keseluruhan) dan rekap kelas (PRD F7).
-- Periode selalu berupa rentang tanggal [p_dari, p_sampai]; "keseluruhan" = tanpa batas bawah.

-- Satuan yang diikuti anak dalam rentang tanggal (kegiatan dihadiri + susulan bertanggal di rentang itu).
create function public.fn_satuan_diikuti(p_generus_id uuid, p_dari date, p_sampai date)
returns table (kitab_id uuid, jenis public.jenis_materi_kitab, satuan integer)
language sql stable
set search_path = ''
as $$
  select km.kitab_id, km.jenis, u.satuan
  from public.presensi p
  join public.kegiatan k on k.id = p.kegiatan_id and k.status <> 'batal' and k.tanggal between p_dari and p_sampai
  join public.kegiatan_materi km on km.kegiatan_id = k.id
  cross join lateral generate_series(km.mulai, km.selesai) as u(satuan)
  where p.generus_id = p_generus_id and p.status in ('hadir', 'terlambat')
  union
  select s.kitab_id, s.jenis, u.satuan
  from public.susulan s
  cross join lateral generate_series(s.mulai, s.selesai) as u(satuan)
  where s.generus_id = p_generus_id and s.tanggal between p_dari and p_sampai
$$;

-- Satuan yang disampaikan ke kelas dalam rentang tanggal.
create function public.fn_satuan_disampaikan(p_kelas_id uuid, p_dari date, p_sampai date)
returns table (kitab_id uuid, jenis public.jenis_materi_kitab, satuan integer)
language sql stable
set search_path = ''
as $$
  select distinct km.kitab_id, km.jenis, u.satuan
  from public.kegiatan k
  join public.kegiatan_kelas kk on kk.kegiatan_id = k.id and kk.kelas_id = p_kelas_id
  join public.kegiatan_materi km on km.kegiatan_id = k.id
  cross join lateral generate_series(km.mulai, km.selesai) as u(satuan)
  where k.status <> 'batal' and k.tanggal between p_dari and p_sampai
$$;

-- ── Progres anak per periode (menggantikan versi tanpa tanggal; argumen lama tetap berlaku lewat default) ──
-- diikuti/kelas dihitung dalam periode. Terlewat = disampaikan di periode yang BELUM pernah diikuti
-- (kapan pun), agar materi yang sudah dikejar sebelum periode tidak dianggap terlewat.
drop function public.fn_progres_anak(uuid);
create function public.fn_progres_anak(p_generus_id uuid, p_dari date default '2000-01-01', p_sampai date default '2999-12-31')
returns table (
  kitab_id uuid, kitab_nama text, kitab_jenis public.jenis_kitab, jenis public.jenis_materi_kitab,
  total integer, diikuti integer, kelas integer, terlewat jsonb
)
language sql stable
set search_path = ''
as $$
  with d as (select * from public.fn_satuan_diikuti(p_generus_id, p_dari, p_sampai)),
  semua as (select * from public.fn_satuan_diikuti(p_generus_id, '2000-01-01', '2999-12-31')),
  k as (
    select * from public.fn_satuan_disampaikan(
      (select g.kelas_id from public.generus g where g.id = p_generus_id), p_dari, p_sampai)
  ),
  pasangan as (select d.kitab_id, d.jenis from d union select k.kitab_id, k.jenis from k)
  select
    p.kitab_id, kt.nama, kt.jenis, p.jenis, kt.total_satuan,
    (select count(*) from d where d.kitab_id = p.kitab_id and d.jenis = p.jenis)::integer,
    (select count(*) from k where k.kitab_id = p.kitab_id and k.jenis = p.jenis)::integer,
    public.fn_ringkas_rentang(p.kitab_id, array(
      select k.satuan from k where k.kitab_id = p.kitab_id and k.jenis = p.jenis
      except
      select semua.satuan from semua where semua.kitab_id = p.kitab_id and semua.jenis = p.jenis
    ))
  from pasangan p
  join public.kitab kt on kt.id = p.kitab_id
  order by kt.jenis desc, kt.nama, p.jenis
$$;

drop function public.fn_progres_quran_per_surat(uuid, public.jenis_materi_kitab);
create function public.fn_progres_quran_per_surat(
  p_generus_id uuid, p_jenis public.jenis_materi_kitab, p_dari date default '2000-01-01', p_sampai date default '2999-12-31'
)
returns table (surat integer, nama text, jumlah_ayat integer, diikuti integer, kelas integer)
language sql stable
set search_path = ''
as $$
  with quran as (select id from public.kitab where jenis = 'quran'),
  d as (
    select x.satuan from public.fn_satuan_diikuti(p_generus_id, p_dari, p_sampai) x
    where x.jenis = p_jenis and x.kitab_id in (select id from quran)
  ),
  k as (
    select x.satuan from public.fn_satuan_disampaikan(
      (select g.kelas_id from public.generus g where g.id = p_generus_id), p_dari, p_sampai) x
    where x.jenis = p_jenis and x.kitab_id in (select id from quran)
  ),
  per as (
    select s.nomor, s.nama_latin, s.jumlah_ayat,
      (select count(*) from d where d.satuan between s.ayat_awal and s.ayat_awal + s.jumlah_ayat - 1)::integer as diikuti,
      (select count(*) from k where k.satuan between s.ayat_awal and s.ayat_awal + s.jumlah_ayat - 1)::integer as kelas
    from public.quran_surat s
  )
  select nomor::integer, nama_latin, jumlah_ayat::integer, diikuti, kelas
  from per where diikuti > 0 or kelas > 0
  order by nomor
$$;

-- ── Rekap kelas (PRD F7) ────────────────────────────────────────────
-- Per anak aktif: kehadiran periode, ketuntasan materi (satuan yang disampaikan di periode dan sudah
-- diikuti anak), butir target periode yang tuntas, posisi tilawati. Tanpa peringkat: urut nama.
create function public.fn_rekap_kelas(p_kelas_id uuid, p_dari date, p_sampai date)
returns table (
  generus_id uuid, nama text, hadir integer, total integer, persen integer, perlu_perhatian boolean,
  satuan_kelas integer, satuan_diikuti integer, butir_target integer, butir_tuntas integer,
  tilawati_jilid integer, tilawati_halaman integer
)
language sql stable
set search_path = ''
as $$
  with kls as (select * from public.fn_satuan_disampaikan(p_kelas_id, p_dari, p_sampai)),
  ambang as (select coalesce((select a.ambang_kehadiran from public.pengaturan a limit 1), 60) as v),
  tgt as (
    select distinct tm.materi_item_id, mi.jenis_kelamin
    from public.target_bulanan_kelas tk
    join public.target_bulanan t on t.id = tk.target_bulanan_id and t.mulai <= p_sampai and t.selesai >= p_dari
    join public.target_materi tm on tm.target_bulanan_id = t.id
    join public.materi_item mi on mi.id = tm.materi_item_id
    where tk.kelas_id = p_kelas_id
  )
  select
    g.id, g.nama, (r.hadir + r.terlambat), r.total, r.persen,
    coalesce(r.persen < (select v from ambang), false),
    (select count(*) from kls)::integer,
    (select count(*) from kls
      join public.fn_satuan_diikuti(g.id, '2000-01-01', p_sampai) x
        on x.kitab_id = kls.kitab_id and x.jenis = kls.jenis and x.satuan = kls.satuan)::integer,
    (select count(*) from tgt where tgt.jenis_kelamin is null or tgt.jenis_kelamin = g.jenis_kelamin)::integer,
    (select count(*) from tgt
      join public.v_penilaian_terakhir pt
        on pt.materi_item_id = tgt.materi_item_id and pt.generus_id = g.id and pt.status = 'lancar'
      where tgt.jenis_kelamin is null or tgt.jenis_kelamin = g.jenis_kelamin)::integer,
    pos.jilid::integer, pos.halaman::integer
  from public.generus g
  cross join lateral public.fn_rekap_presensi(g.id, p_dari, p_sampai) r
  left join public.v_posisi_tilawati pos on pos.generus_id = g.id
  where g.kelas_id = p_kelas_id and g.status = 'aktif'
  order by g.nama
$$;

-- Rata-rata kelas untuk kartu ringkasan (anak tanpa data pada periode itu tidak ikut dirata-rata).
create function public.fn_rekap_kelas_ringkas(p_kelas_id uuid, p_dari date, p_sampai date)
returns table (jumlah_anak integer, rata_kehadiran integer, rata_ketuntasan integer, rata_target integer, perlu_perhatian integer)
language sql stable
set search_path = ''
as $$
  select
    count(*)::integer,
    round(avg(r.persen))::integer,
    round(avg(100.0 * r.satuan_diikuti / nullif(r.satuan_kelas, 0)))::integer,
    round(avg(100.0 * r.butir_tuntas / nullif(r.butir_target, 0)))::integer,
    (count(*) filter (where r.perlu_perhatian))::integer
  from public.fn_rekap_kelas(p_kelas_id, p_dari, p_sampai) r
$$;
