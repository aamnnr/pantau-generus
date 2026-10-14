-- Pendukung Tahap 3 (Pengajian Hari Ini & detail kegiatan).

-- Urutan baris materi sesuai urutan input guru.
alter table public.kegiatan_materi add column urutan smallint not null default 0;

-- ── Ringkasan kegiatan untuk kartu "Pengajian Hari Ini" & Riwayat ───
-- security_invoker: RLS kegiatan/presensi tetap berlaku (guru hanya melihat kelasnya).
create view public.v_kegiatan_ringkas with (security_invoker = true) as
select
  k.id,
  k.kelompok_id,
  k.tanggal,
  k.jam_mulai,
  k.jam_selesai,
  k.judul,
  k.jenis,
  k.status,
  k.jadwal_rutin_id,
  coalesce((
    select jsonb_agg(jsonb_build_object('id', kl.id, 'nama', kl.nama, 'jenjang', kl.jenjang)
                     order by kl.jenjang, kl.urutan, kl.nama)
    from public.kegiatan_kelas kk join public.kelas kl on kl.id = kk.kelas_id
    where kk.kegiatan_id = k.id
  ), '[]'::jsonb) as kelas,
  coalesce((
    select array_agg(g.nama order by g.nama)
    from public.kegiatan_pengajar kp join public.guru g on g.id = kp.guru_id
    where kp.kegiatan_id = k.id
  ), '{}') as pengajar,
  (select count(*) from public.presensi p where p.kegiatan_id = k.id)::int as jumlah_presensi,
  (select count(*) from public.kegiatan_materi m where m.kegiatan_id = k.id)::int as jumlah_materi
from public.kegiatan k;

-- ── Materi kegiatan siap tampil & siap diedit ───────────────────────
create view public.v_kegiatan_materi with (security_invoker = true) as
select
  m.id,
  m.kegiatan_id,
  m.kitab_id,
  m.jenis,
  m.mulai,
  m.selesai,
  m.urutan,
  kt.nama as kitab_nama,
  kt.jenis as kitab_jenis,
  public.fn_format_rentang(m.kitab_id, m.mulai, m.selesai) as teks,
  a.surat as mulai_surat,
  a.ayat as mulai_ayat,
  b.surat as selesai_surat,
  b.ayat as selesai_ayat
from public.kegiatan_materi m
join public.kitab kt on kt.id = m.kitab_id
left join lateral public.fn_surat_ayat(m.mulai) a on kt.jenis = 'quran'
left join lateral public.fn_surat_ayat(m.selesai) b on kt.jenis = 'quran';

-- ── Simpan materi kegiatan (ganti seluruh baris, atomik) ────────────
-- Al-Qur'an dikirim sebagai surat:ayat lalu dikonversi ke ayat global di sini (ARCHITECTURE §4.6).
-- security invoker: RLS kegiatan_materi tetap menjadi penjaga.
create function public.simpan_materi_kegiatan(p_kegiatan_id uuid, p_baris jsonb) returns void
language plpgsql
set search_path = ''
as $$
declare
  r record;
  v_kitab public.kitab;
  v_mulai integer;
  v_selesai integer;
  v_kelompok uuid;
  i integer := 0;
begin
  if not public.boleh_kelola_kegiatan(p_kegiatan_id) then
    raise exception 'Anda tidak memiliki akses ke kegiatan ini' using errcode = '42501';
  end if;
  select kelompok_id into v_kelompok from public.kegiatan where id = p_kegiatan_id;

  delete from public.kegiatan_materi where kegiatan_id = p_kegiatan_id;

  for r in
    select * from jsonb_to_recordset(coalesce(p_baris, '[]'::jsonb)) as x(
      kitab_id uuid, jenis public.jenis_materi_kitab,
      mulai integer, selesai integer,
      mulai_surat integer, mulai_ayat integer, selesai_surat integer, selesai_ayat integer
    )
  loop
    i := i + 1;
    select * into v_kitab from public.kitab where id = r.kitab_id;
    if v_kitab.id is null then
      raise exception 'Baris %: pilih kitab', i using errcode = '22023';
    end if;

    if v_kitab.jenis = 'quran' then
      if r.mulai_surat is null or r.mulai_ayat is null or r.selesai_ayat is null then
        raise exception 'Baris %: lengkapi surat dan ayat', i using errcode = '22023';
      end if;
      v_mulai := public.fn_ayat_global(r.mulai_surat, r.mulai_ayat);
      v_selesai := public.fn_ayat_global(coalesce(r.selesai_surat, r.mulai_surat), r.selesai_ayat);
    else
      if r.mulai is null or r.selesai is null then
        raise exception 'Baris %: lengkapi halaman dari dan sampai', i using errcode = '22023';
      end if;
      v_mulai := r.mulai;
      v_selesai := r.selesai;
    end if;

    if v_mulai > v_selesai then
      raise exception 'Baris %: "sampai" harus sesudah "dari"', i using errcode = '22023';
    end if;

    insert into public.kegiatan_materi (kelompok_id, kegiatan_id, kitab_id, jenis, mulai, selesai, urutan)
    values (v_kelompok, p_kegiatan_id, r.kitab_id, coalesce(r.jenis, 'makna'), v_mulai, v_selesai, i);
  end loop;
end $$;

-- ── Simpan rundown (ganti seluruh baris, atomik) ────────────────────
create function public.simpan_rundown(p_kegiatan_id uuid, p_baris jsonb) returns void
language plpgsql
set search_path = ''
as $$
declare
  v_kelompok uuid;
begin
  if not public.boleh_kelola_kegiatan(p_kegiatan_id) then
    raise exception 'Anda tidak memiliki akses ke kegiatan ini' using errcode = '42501';
  end if;
  select kelompok_id into v_kelompok from public.kegiatan where id = p_kegiatan_id;

  delete from public.kegiatan_rundown where kegiatan_id = p_kegiatan_id;
  insert into public.kegiatan_rundown (kelompok_id, kegiatan_id, urutan, waktu, aktivitas)
  select v_kelompok, p_kegiatan_id, x.n, nullif(x.r ->> 'waktu', '')::time, trim(x.r ->> 'aktivitas')
  from jsonb_array_elements(coalesce(p_baris, '[]'::jsonb)) with ordinality as x(r, n)
  where trim(coalesce(x.r ->> 'aktivitas', '')) <> '';
end $$;

revoke execute on function public.simpan_materi_kegiatan(uuid, jsonb) from public, anon;
revoke execute on function public.simpan_rundown(uuid, jsonb) from public, anon;
grant execute on function public.simpan_materi_kegiatan(uuid, jsonb) to authenticated;
grant execute on function public.simpan_rundown(uuid, jsonb) to authenticated;
