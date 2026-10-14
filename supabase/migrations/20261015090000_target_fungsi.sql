-- Pendukung Tahap 4 (Target periode).

-- ── Konversi satu baris input rentang (dipakai materi kegiatan & target) ────
-- Al-Qur'an: surat:ayat → ayat global; Al-Hadist: halaman apa adanya. Pesan galat menyebut nomor baris.
create function public.fn_rentang_masukan(
  p_baris jsonb, p_nomor integer,
  out kitab_id uuid, out jenis public.jenis_materi_kitab, out mulai integer, out selesai integer
)
language plpgsql stable
set search_path = ''
as $$
declare
  v_kitab public.kitab;
  v_surat_awal integer := (p_baris ->> 'mulai_surat')::integer;
  v_ayat_awal integer := (p_baris ->> 'mulai_ayat')::integer;
  v_surat_akhir integer := coalesce((p_baris ->> 'selesai_surat')::integer, (p_baris ->> 'mulai_surat')::integer);
  v_ayat_akhir integer := (p_baris ->> 'selesai_ayat')::integer;
begin
  select * into v_kitab from public.kitab where id = (p_baris ->> 'kitab_id')::uuid;
  if v_kitab.id is null then
    raise exception 'Baris %: pilih kitab', p_nomor using errcode = '22023';
  end if;
  kitab_id := v_kitab.id;
  jenis := coalesce((p_baris ->> 'jenis')::public.jenis_materi_kitab, 'makna');

  if v_kitab.jenis = 'quran' then
    if v_surat_awal is null or v_ayat_awal is null or v_ayat_akhir is null then
      raise exception 'Baris %: lengkapi surat dan ayat', p_nomor using errcode = '22023';
    end if;
    mulai := public.fn_ayat_global(v_surat_awal, v_ayat_awal);
    selesai := public.fn_ayat_global(v_surat_akhir, v_ayat_akhir);
  else
    mulai := (p_baris ->> 'mulai')::integer;
    selesai := (p_baris ->> 'selesai')::integer;
    if mulai is null or selesai is null then
      raise exception 'Baris %: lengkapi halaman dari dan sampai', p_nomor using errcode = '22023';
    end if;
  end if;

  if mulai > selesai then
    raise exception 'Baris %: "sampai" harus sesudah "dari"', p_nomor using errcode = '22023';
  end if;
end $$;

-- simpan_materi_kegiatan memakai konversi bersama (perilaku sama, uji 07 tetap berlaku).
create or replace function public.simpan_materi_kegiatan(p_kegiatan_id uuid, p_baris jsonb) returns void
language plpgsql
set search_path = ''
as $$
declare
  v_kelompok uuid;
  r record;
begin
  if not public.boleh_kelola_kegiatan(p_kegiatan_id) then
    raise exception 'Anda tidak memiliki akses ke kegiatan ini' using errcode = '42501';
  end if;
  select kelompok_id into v_kelompok from public.kegiatan where id = p_kegiatan_id;

  delete from public.kegiatan_materi where kegiatan_id = p_kegiatan_id;
  for r in select x.n, (public.fn_rentang_masukan(x.v, x.n::integer)).*
           from jsonb_array_elements(coalesce(p_baris, '[]'::jsonb)) with ordinality as x(v, n)
  loop
    insert into public.kegiatan_materi (kelompok_id, kegiatan_id, kitab_id, jenis, mulai, selesai, urutan)
    values (v_kelompok, p_kegiatan_id, r.kitab_id, r.jenis, r.mulai, r.selesai, r.n);
  end loop;
end $$;

-- ── Isi target ──────────────────────────────────────────────────────

alter table public.target_kitab add column urutan smallint not null default 0;

create view public.v_target_kitab with (security_invoker = true) as
select
  t.id,
  t.target_bulanan_id,
  t.kitab_id,
  t.jenis,
  t.mulai,
  t.selesai,
  t.urutan,
  kt.nama as kitab_nama,
  kt.jenis as kitab_jenis,
  public.fn_format_rentang(t.kitab_id, t.mulai, t.selesai) as teks,
  a.surat as mulai_surat,
  a.ayat as mulai_ayat,
  b.surat as selesai_surat,
  b.ayat as selesai_ayat
from public.target_kitab t
join public.kitab kt on kt.id = t.kitab_id
left join lateral public.fn_surat_ayat(t.mulai) a on kt.jenis = 'quran'
left join lateral public.fn_surat_ayat(t.selesai) b on kt.jenis = 'quran';

create view public.v_target_ringkas with (security_invoker = true) as
select
  t.id,
  t.kelompok_id,
  t.judul,
  t.semester,
  t.mulai,
  t.selesai,
  t.catatan,
  t.dibuat_oleh,
  coalesce((
    select jsonb_agg(jsonb_build_object('id', kl.id, 'nama', kl.nama, 'jenjang', kl.jenjang)
                     order by kl.jenjang, kl.urutan, kl.nama)
    from public.target_bulanan_kelas tk join public.kelas kl on kl.id = tk.kelas_id
    where tk.target_bulanan_id = t.id
  ), '[]'::jsonb) as kelas,
  (select count(*) from public.target_kitab x where x.target_bulanan_id = t.id)::int as jumlah_kitab,
  (select count(*) from public.target_materi x where x.target_bulanan_id = t.id)::int as jumlah_materi,
  exists (select 1 from public.target_tilawati x where x.target_bulanan_id = t.id) as ada_tilawati,
  public.boleh_kelola_target(t.id) as boleh_kelola
from public.target_bulanan t;

-- Ganti seluruh isi target (bacaan/makna, materi item, tilawati) secara atomik.
create function public.simpan_isi_target(
  p_target_id uuid, p_kitab jsonb, p_materi_item_ids uuid[], p_tilawati jsonb
) returns void
language plpgsql
set search_path = ''
as $$
declare
  v_kelompok uuid;
  r record;
begin
  if not public.boleh_kelola_target(p_target_id) then
    raise exception 'Anda tidak memiliki akses ke target ini' using errcode = '42501';
  end if;
  select kelompok_id into v_kelompok from public.target_bulanan where id = p_target_id;

  delete from public.target_kitab where target_bulanan_id = p_target_id;
  for r in select x.n, (public.fn_rentang_masukan(x.v, x.n::integer)).*
           from jsonb_array_elements(coalesce(p_kitab, '[]'::jsonb)) with ordinality as x(v, n)
  loop
    insert into public.target_kitab (kelompok_id, target_bulanan_id, kitab_id, jenis, mulai, selesai, urutan)
    values (v_kelompok, p_target_id, r.kitab_id, r.jenis, r.mulai, r.selesai, r.n);
  end loop;

  delete from public.target_materi
  where target_bulanan_id = p_target_id and materi_item_id <> all (coalesce(p_materi_item_ids, '{}'));
  insert into public.target_materi (kelompok_id, target_bulanan_id, materi_item_id)
  select v_kelompok, p_target_id, x from unnest(coalesce(p_materi_item_ids, '{}')) as x
  on conflict (target_bulanan_id, materi_item_id) do nothing;

  delete from public.target_tilawati where target_bulanan_id = p_target_id;
  if p_tilawati is not null and p_tilawati ->> 'jilid' is not null then
    insert into public.target_tilawati (kelompok_id, target_bulanan_id, jilid, halaman)
    values (v_kelompok, p_target_id, (p_tilawati ->> 'jilid')::smallint, coalesce((p_tilawati ->> 'halaman')::smallint, 0));
  end if;
end $$;

-- "Salin dari periode sebelumnya" (PRD F5): salin isi, bukan info/kelas.
create function public.salin_isi_target(p_sumber_id uuid, p_tujuan_id uuid) returns void
language plpgsql
set search_path = ''
as $$
declare
  v_kelompok uuid;
begin
  if not public.boleh_kelola_target(p_tujuan_id) then
    raise exception 'Anda tidak memiliki akses ke target ini' using errcode = '42501';
  end if;
  select kelompok_id into v_kelompok from public.target_bulanan where id = p_tujuan_id;

  insert into public.target_kitab (kelompok_id, target_bulanan_id, kitab_id, jenis, mulai, selesai, urutan)
  select v_kelompok, p_tujuan_id, kitab_id, jenis, mulai, selesai, urutan
  from public.target_kitab where target_bulanan_id = p_sumber_id;

  insert into public.target_materi (kelompok_id, target_bulanan_id, materi_item_id)
  select v_kelompok, p_tujuan_id, materi_item_id
  from public.target_materi where target_bulanan_id = p_sumber_id
  on conflict do nothing;

  insert into public.target_tilawati (kelompok_id, target_bulanan_id, jilid, halaman)
  select v_kelompok, p_tujuan_id, jilid, halaman
  from public.target_tilawati where target_bulanan_id = p_sumber_id
  on conflict do nothing;
end $$;

revoke execute on function public.simpan_isi_target(uuid, jsonb, uuid[], jsonb) from public, anon;
revoke execute on function public.salin_isi_target(uuid, uuid) from public, anon;
grant execute on function public.simpan_isi_target(uuid, jsonb, uuid[], jsonb) to authenticated;
grant execute on function public.salin_isi_target(uuid, uuid) to authenticated;
