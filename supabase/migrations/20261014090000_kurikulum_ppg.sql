-- Menyesuaikan dengan format target dari tim kurikulum PPG (dokumen "Target Materi Pembelajaran"):
-- 1. Materi item dikelompokkan Aspek → Mapel, bisa khusus putra/putri.
-- 2. Rentang kitab punya jenis: makna atau bacaan (bacaan hanya Al-Qur'an).
-- 3. Target memakai periode (mulai–selesai, bukan bulan kalender) dan bisa berlaku untuk beberapa kelas.

create type public.aspek as enum ('alim', 'faqih', 'akhlaqul_karimah', 'mandiri');
create type public.jenis_materi_kitab as enum ('makna', 'bacaan');

-- ── 1. Materi item ─────────────────────────────────────────────────

alter table public.materi_item drop constraint materi_item_kelompok_id_jenis_nama_key;
alter table public.materi_item drop column jenis;
drop type public.jenis_materi;

alter table public.materi_item
  add column aspek public.aspek not null,
  -- Mapel teks bebas (Hafalan, Kefahaman Agama, Praktek Ibadah, Akhlaq, Tata Krama, Kemandirian, …)
  -- karena daftar mapel ditentukan lembaga atas dan bisa berubah antar semester.
  add column mapel text not null check (length(trim(mapel)) > 0),
  add column keterangan text,
  -- null = untuk semua; diisi = hanya generus putra/putri (mis. ketrampilan Mandiri).
  add column jenis_kelamin public.jenis_kelamin,
  add constraint materi_item_unik unique (kelompok_id, aspek, mapel, nama);

-- ── 2. Jenis rentang kitab: makna / bacaan ─────────────────────────

alter table public.target_makna rename to target_kitab;
alter policy target_makna_select on public.target_kitab rename to target_kitab_select;
alter policy target_makna_tulis on public.target_kitab rename to target_kitab_tulis;

alter table public.kegiatan_materi add column jenis public.jenis_materi_kitab not null default 'makna';
alter table public.susulan add column jenis public.jenis_materi_kitab not null default 'makna';
alter table public.target_kitab add column jenis public.jenis_materi_kitab not null default 'makna';

create or replace function public.cek_rentang_kitab() returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_kitab public.kitab;
begin
  select * into v_kitab from public.kitab where id = new.kitab_id;
  if new.mulai < 1 or new.selesai > v_kitab.total_satuan then
    raise exception 'Rentang %–% di luar batas kitab (1–%)', new.mulai, new.selesai, v_kitab.total_satuan
      using errcode = '23514';
  end if;
  if new.jenis = 'bacaan' and v_kitab.jenis <> 'quran' then
    raise exception 'Bacaan hanya untuk Al-Qur''an' using errcode = '23514';
  end if;
  return new;
end $$;

-- ── 3. Target berperiode, untuk ≥1 kelas ───────────────────────────

alter table public.target_bulanan drop constraint target_bulanan_kelas_id_bulan_key;
alter table public.target_bulanan
  drop column kelas_id,
  drop column bulan,
  add column judul text not null check (length(trim(judul)) > 0), -- mis. "Periode Bulan Oktober"
  add column semester text,                                        -- mis. "Semester 1 - 2026"
  add column mulai date not null,
  add column selesai date not null,
  add column catatan text,                                         -- strategi pembelajaran, lampiran
  add constraint target_bulanan_periode check (selesai >= mulai);

create table public.target_bulanan_kelas (
  id uuid primary key default gen_random_uuid(),
  kelompok_id uuid not null default public.kelompok_saya() references public.kelompok (id),
  target_bulanan_id uuid not null references public.target_bulanan (id) on delete cascade,
  kelas_id uuid not null references public.kelas (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (target_bulanan_id, kelas_id)
);
create index on public.target_bulanan_kelas (kelas_id);

create trigger set_updated_at before update on public.target_bulanan_kelas
  for each row execute function public.set_updated_at();

-- Satu kelas tidak boleh punya dua target yang periodenya tumpang tindih:
-- raport & progres "vs target" harus jelas memakai target yang mana.
create function public.cek_target_tumpang_tindih(p_target_id uuid) returns void
language plpgsql
set search_path = ''
as $$
declare
  v_kelas text;
begin
  select k.nama into v_kelas
  from public.target_bulanan t
  join public.target_bulanan_kelas tk on tk.target_bulanan_id = t.id
  join public.target_bulanan_kelas lain on lain.kelas_id = tk.kelas_id and lain.target_bulanan_id <> t.id
  join public.target_bulanan tl on tl.id = lain.target_bulanan_id
  join public.kelas k on k.id = tk.kelas_id
  where t.id = p_target_id
    and daterange(t.mulai, t.selesai, '[]') && daterange(tl.mulai, tl.selesai, '[]')
  limit 1;

  if v_kelas is not null then
    raise exception 'Kelas % sudah punya target pada periode yang bertumpukan', v_kelas
      using errcode = '23P01';
  end if;
end $$;

create function public.trg_cek_target_kelas() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  perform public.cek_target_tumpang_tindih(new.target_bulanan_id);
  return new;
end $$;

create function public.trg_cek_target_periode() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  perform public.cek_target_tumpang_tindih(new.id);
  return new;
end $$;

create trigger cek_tumpang_tindih after insert or update on public.target_bulanan_kelas
  for each row execute function public.trg_cek_target_kelas();
create trigger cek_tumpang_tindih after update of mulai, selesai on public.target_bulanan
  for each row execute function public.trg_cek_target_periode();

alter table public.target_bulanan_kelas enable row level security;

create policy target_bulanan_kelas_select on public.target_bulanan_kelas for select to authenticated
  using (kelompok_id = (select public.kelompok_saya()));
create policy target_bulanan_kelas_tulis on public.target_bulanan_kelas for all to authenticated
  using (kelompok_id = (select public.kelompok_saya()) and (select public.punya_peran('admin')))
  with check (kelompok_id = (select public.kelompok_saya()) and (select public.punya_peran('admin')));
