-- Tahap 5: progres makna/bacaan, materi terlewat, susulan, penilaian, tilawati (PRD F6, ARCHITECTURE §5).
-- Semua view security_invoker dan fungsi invoker: RLS tabel sumber tetap berlaku (wali hanya anaknya, dst.).

-- ── Himpunan satuan ─────────────────────────────────────────────────

-- Satuan yang disampaikan ke sebuah kelas; kegiatan gabungan terhitung untuk setiap kelas peserta.
create view public.v_satuan_disampaikan with (security_invoker = true) as
select distinct kk.kelas_id, km.kitab_id, km.jenis, u.satuan
from public.kegiatan k
join public.kegiatan_kelas kk on kk.kegiatan_id = k.id
join public.kegiatan_materi km on km.kegiatan_id = k.id
cross join lateral generate_series(km.mulai, km.selesai) as u(satuan)
where k.status <> 'batal';

-- Satuan yang diikuti anak: kegiatan yang dihadiri (hadir/terlambat) + susulan. Unik (PRD F6 aturan 3).
create view public.v_satuan_diikuti with (security_invoker = true) as
select p.generus_id, km.kitab_id, km.jenis, u.satuan
from public.presensi p
join public.kegiatan k on k.id = p.kegiatan_id and k.status <> 'batal'
join public.kegiatan_materi km on km.kegiatan_id = k.id
cross join lateral generate_series(km.mulai, km.selesai) as u(satuan)
where p.status in ('hadir', 'terlambat')
union
select s.generus_id, s.kitab_id, s.jenis, u.satuan
from public.susulan s
cross join lateral generate_series(s.mulai, s.selesai) as u(satuan);

-- Ringkas himpunan satuan menjadi rentang berurutan (gaps-and-islands).
create function public.fn_ringkas_rentang(p_kitab_id uuid, p_satuan integer[]) returns jsonb
language sql stable
set search_path = ''
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
           'mulai', r.mulai, 'selesai', r.selesai,
           'teks', public.fn_format_rentang(p_kitab_id, r.mulai, r.selesai)
         ) order by r.mulai), '[]'::jsonb)
  from (
    select min(s) as mulai, max(s) as selesai
    from (select s, s - row_number() over (order by s) as grp from unnest(p_satuan) as s) x
    group by grp
  ) r
$$;

-- ── Progres anak per kitab & jenis ──────────────────────────────────
-- kelas = satuan yang disampaikan ke kelas anak saat ini; terlewat = kelas − diikuti (PRD F6 aturan 5).
create function public.fn_progres_anak(p_generus_id uuid)
returns table (
  kitab_id uuid, kitab_nama text, kitab_jenis public.jenis_kitab, jenis public.jenis_materi_kitab,
  total integer, diikuti integer, kelas integer, terlewat jsonb
)
language sql stable
set search_path = ''
as $$
  with d as (
    select v.kitab_id, v.jenis, v.satuan from public.v_satuan_diikuti v where v.generus_id = p_generus_id
  ),
  k as (
    select v.kitab_id, v.jenis, v.satuan
    from public.v_satuan_disampaikan v
    where v.kelas_id = (select g.kelas_id from public.generus g where g.id = p_generus_id)
  ),
  pasangan as (select d.kitab_id, d.jenis from d union select k.kitab_id, k.jenis from k)
  select
    p.kitab_id, kt.nama, kt.jenis, p.jenis, kt.total_satuan,
    (select count(*) from d where d.kitab_id = p.kitab_id and d.jenis = p.jenis)::integer,
    (select count(*) from k where k.kitab_id = p.kitab_id and k.jenis = p.jenis)::integer,
    public.fn_ringkas_rentang(p.kitab_id, array(
      select k.satuan from k where k.kitab_id = p.kitab_id and k.jenis = p.jenis
      except
      select d.satuan from d where d.kitab_id = p.kitab_id and d.jenis = p.jenis
    ))
  from pasangan p
  join public.kitab kt on kt.id = p.kitab_id
  order by kt.jenis desc, kt.nama, p.jenis
$$;

-- Al-Qur'an per surat yang sudah dimulai (PRD F6 aturan 7).
create function public.fn_progres_quran_per_surat(p_generus_id uuid, p_jenis public.jenis_materi_kitab)
returns table (surat integer, nama text, jumlah_ayat integer, diikuti integer, kelas integer)
language sql stable
set search_path = ''
as $$
  with quran as (select id from public.kitab where jenis = 'quran'),
  d as (
    select v.satuan from public.v_satuan_diikuti v
    where v.generus_id = p_generus_id and v.jenis = p_jenis and v.kitab_id in (select id from quran)
  ),
  k as (
    select v.satuan from public.v_satuan_disampaikan v
    where v.kelas_id = (select g.kelas_id from public.generus g where g.id = p_generus_id)
      and v.jenis = p_jenis and v.kitab_id in (select id from quran)
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

-- Capaian anak terhadap baris bacaan/makna sebuah target (satuan dalam rentang target yang diikuti).
create function public.fn_capaian_target_kitab(p_generus_id uuid, p_target_id uuid)
returns table (
  id uuid, kitab_id uuid, kitab_nama text, jenis public.jenis_materi_kitab, teks text,
  total integer, diikuti integer, kelas integer
)
language sql stable
set search_path = ''
as $$
  select
    t.id, t.kitab_id, t.kitab_nama, t.jenis, t.teks,
    (t.selesai - t.mulai + 1)::integer,
    (select count(*) from public.v_satuan_diikuti v
      where v.generus_id = p_generus_id and v.kitab_id = t.kitab_id and v.jenis = t.jenis
        and v.satuan between t.mulai and t.selesai)::integer,
    (select count(*) from public.v_satuan_disampaikan v
      where v.kelas_id = (select g.kelas_id from public.generus g where g.id = p_generus_id)
        and v.kitab_id = t.kitab_id and v.jenis = t.jenis
        and v.satuan between t.mulai and t.selesai)::integer
  from public.v_target_kitab t
  where t.target_bulanan_id = p_target_id
  order by t.jenis, t.urutan
$$;

-- ── Kehadiran ───────────────────────────────────────────────────────
-- Persen = (hadir + terlambat) ÷ kegiatan yang presensinya sudah diisi; kegiatan libur tidak dihitung.
create function public.fn_rekap_presensi(p_generus_id uuid, p_dari date, p_sampai date)
returns table (hadir integer, terlambat integer, izin integer, sakit integer, alpa integer, total integer, persen integer)
language sql stable
set search_path = ''
as $$
  with x as (
    select p.status
    from public.presensi p
    join public.kegiatan k on k.id = p.kegiatan_id and k.status <> 'batal'
    where p.generus_id = p_generus_id and k.tanggal between p_dari and p_sampai
  )
  select
    count(*) filter (where status = 'hadir')::integer,
    count(*) filter (where status = 'terlambat')::integer,
    count(*) filter (where status = 'izin')::integer,
    count(*) filter (where status = 'sakit')::integer,
    count(*) filter (where status = 'alpa')::integer,
    count(*)::integer,
    case when count(*) = 0 then null
         else round(100.0 * count(*) filter (where status in ('hadir', 'terlambat')) / count(*))::integer end
  from x
$$;

-- ── Materi item ─────────────────────────────────────────────────────

-- Status terakhir yang berlaku (penilaian append-only).
create view public.v_penilaian_terakhir with (security_invoker = true) as
select distinct on (generus_id, materi_item_id)
  generus_id, materi_item_id, status, tanggal
from public.penilaian
order by generus_id, materi_item_id, tanggal desc, created_at desc;

-- "Sudah menerima": hadir/terlambat di kegiatan yang mencantumkan butir tsb.
create view public.v_materi_item_diterima with (security_invoker = true) as
select p.generus_id, kmi.materi_item_id, max(k.tanggal) as terakhir, count(*)::integer as kali
from public.presensi p
join public.kegiatan k on k.id = p.kegiatan_id and k.status <> 'batal'
join public.kegiatan_materi_item kmi on kmi.kegiatan_id = k.id
where p.status in ('hadir', 'terlambat')
group by p.generus_id, kmi.materi_item_id;

-- Penulis susulan/penilaian/tilawati (ARCHITECTURE §6): admin, atau guru kelas anak tsb.
-- Dicek eksplisit agar pesannya jelas; RLS tetap menjadi pengaman terakhir.
create function public.boleh_nilai_generus(p_generus_id uuid) returns boolean
language sql stable security definer
set search_path = ''
as $$
  select public.punya_peran('admin') or public.guru_mengajar_generus(p_generus_id)
$$;

create function public.cek_boleh_nilai(p_generus_id uuid) returns void
language plpgsql stable
set search_path = ''
as $$
begin
  if not public.boleh_nilai_generus(p_generus_id) then
    raise exception 'Anda tidak memiliki akses untuk mencatat capaian anak ini' using errcode = '42501';
  end if;
end $$;

-- ── Susulan ─────────────────────────────────────────────────────────

-- Rentang dikirim seperti materi kegiatan (surat:ayat untuk Al-Qur'an); guru pencatat diisi otomatis.
create function public.simpan_susulan(p_generus_id uuid, p_baris jsonb, p_tanggal date) returns uuid
language plpgsql
set search_path = ''
as $$
declare
  r record;
  v_id uuid;
begin
  perform public.cek_boleh_nilai(p_generus_id);
  select * into r from public.fn_rentang_masukan(p_baris, 1);
  insert into public.susulan (generus_id, kitab_id, jenis, mulai, selesai, tanggal, guru_id)
  values (
    p_generus_id, r.kitab_id, r.jenis, r.mulai, r.selesai, coalesce(p_tanggal, public.hari_ini()),
    (select g.id from public.guru g where g.profil_id = auth.uid() limit 1)
  )
  returning id into v_id;
  return v_id;
end $$;

create view public.v_susulan with (security_invoker = true) as
select s.id, s.generus_id, s.kitab_id, s.jenis, s.mulai, s.selesai, s.tanggal,
  kt.nama as kitab_nama, public.fn_format_rentang(s.kitab_id, s.mulai, s.selesai) as teks, g.nama as guru_nama
from public.susulan s
join public.kitab kt on kt.id = s.kitab_id
left join public.guru g on g.id = s.guru_id;

-- ── Tilawati ────────────────────────────────────────────────────────

-- Posisi saat ini = entri terakhir; total_halaman null bila jilid belum diatur admin.
create view public.v_posisi_tilawati with (security_invoker = true) as
select x.generus_id, x.jilid, x.halaman, x.tanggal, j.total_halaman
from (
  select distinct on (generus_id) generus_id, kelompok_id, jilid, halaman, tanggal
  from public.capaian_tilawati
  order by generus_id, tanggal desc, created_at desc
) x
left join public.jilid_tilawati j on j.kelompok_id = x.kelompok_id and j.jilid = x.jilid;

create function public.fn_tanggal_capaian(p_kegiatan_id uuid) returns date
language sql stable
set search_path = ''
as $$
  select coalesce((select tanggal from public.kegiatan where id = p_kegiatan_id), public.hari_ini())
$$;

-- Tombol +N (PRD F6): halaman dibatasi di akhir jilid; `sisa` > 0 atau halaman = total → tawarkan naik jilid.
create function public.tambah_tilawati(p_generus_id uuid, p_tambahan integer, p_kegiatan_id uuid default null)
returns table (jilid integer, halaman integer, total_halaman integer, sisa integer)
language plpgsql
set search_path = ''
as $$
declare
  v_pos record;
  v_baru integer;
  v_sisa integer := 0;
begin
  perform public.cek_boleh_nilai(p_generus_id);
  if p_tambahan is null or p_tambahan < 1 then
    raise exception 'Jumlah halaman minimal 1' using errcode = '22023';
  end if;
  select * into v_pos from public.v_posisi_tilawati v where v.generus_id = p_generus_id;
  if v_pos.generus_id is null then
    raise exception 'Posisi awal tilawati anak ini belum diisi' using errcode = '22023';
  end if;

  v_baru := v_pos.halaman + p_tambahan;
  if v_pos.total_halaman is not null and v_baru > v_pos.total_halaman then
    v_sisa := v_baru - v_pos.total_halaman;
    v_baru := v_pos.total_halaman;
  end if;

  insert into public.capaian_tilawati (generus_id, jenis, tambahan, jilid, halaman, kegiatan_id, tanggal)
  values (p_generus_id, 'tambah', p_tambahan, v_pos.jilid, v_baru, p_kegiatan_id, public.fn_tanggal_capaian(p_kegiatan_id));

  return query select v_pos.jilid::integer, v_baru, v_pos.total_halaman::integer, v_sisa;
end $$;

-- Koreksi posisi atau naik jilid (jenis 'koreksi' / 'naik_jilid'); halaman divalidasi terhadap jumlah halaman jilid.
create function public.atur_posisi_tilawati(
  p_generus_id uuid, p_jilid integer, p_halaman integer, p_naik boolean default false, p_kegiatan_id uuid default null
) returns void
language plpgsql
set search_path = ''
as $$
declare
  v_total integer;
begin
  perform public.cek_boleh_nilai(p_generus_id);
  select j.total_halaman into v_total
  from public.jilid_tilawati j
  join public.generus g on g.kelompok_id = j.kelompok_id
  where g.id = p_generus_id and j.jilid = p_jilid;

  if v_total is null then
    raise exception 'Jilid % belum diatur. Minta admin menambahkannya di menu Jilid Tilawati.', p_jilid using errcode = '22023';
  end if;
  if p_halaman is null or p_halaman < 0 or p_halaman > v_total then
    raise exception 'Jilid % hanya memiliki % halaman', p_jilid, v_total using errcode = '22023';
  end if;

  insert into public.capaian_tilawati (generus_id, jenis, jilid, halaman, kegiatan_id, tanggal)
  values (p_generus_id, case when p_naik then 'naik_jilid' else 'koreksi' end::public.jenis_capaian_tilawati,
          p_jilid, p_halaman, p_kegiatan_id, public.fn_tanggal_capaian(p_kegiatan_id));
end $$;

-- ── Hak eksekusi ────────────────────────────────────────────────────

revoke execute on function public.simpan_susulan(uuid, jsonb, date) from public, anon;
revoke execute on function public.tambah_tilawati(uuid, integer, uuid) from public, anon;
revoke execute on function public.atur_posisi_tilawati(uuid, integer, integer, boolean, uuid) from public, anon;
grant execute on function public.simpan_susulan(uuid, jsonb, date) to authenticated;
grant execute on function public.tambah_tilawati(uuid, integer, uuid) to authenticated;
grant execute on function public.atur_posisi_tilawati(uuid, integer, integer, boolean, uuid) to authenticated;
