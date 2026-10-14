-- RLS penilaian, tilawati, target bulanan, catatan raport.
begin;
\ir _setup.psql
select plan(14);

insert into public.materi_item (id, kelompok_id, aspek, mapel, nama) values
  ('a0000000-0000-0000-0000-000000000301', 'a0000000-0000-0000-0000-000000000000', 'alim', 'Hafalan', 'Doa Sebelum Makan');
insert into public.penilaian (kelompok_id, generus_id, materi_item_id, status) values
  ('a0000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-0000000000e2', 'a0000000-0000-0000-0000-000000000301', 'proses');

-- ── Guru Satu (K1: anak1) ───────────────────────────────────────────
set local role authenticated;
set local request.jwt.claims to '{"sub":"a0000000-0000-0000-0000-0000000000a2","role":"authenticated"}';

select lives_ok(
  $$ insert into public.penilaian (generus_id, materi_item_id, status)
     values ('a0000000-0000-0000-0000-0000000000e1', 'a0000000-0000-0000-0000-000000000301', 'lancar') $$,
  'guru: boleh menilai anak kelasnya'
);
select is(
  (select dinilai_oleh::text from public.penilaian where generus_id = 'a0000000-0000-0000-0000-0000000000e1'),
  'a0000000-0000-0000-0000-0000000000a2', 'penilaian mencatat penilai'
);
select throws_ok(
  $$ insert into public.penilaian (generus_id, materi_item_id, status)
     values ('a0000000-0000-0000-0000-0000000000e2', 'a0000000-0000-0000-0000-000000000301', 'lancar') $$,
  '42501', null, 'guru: tidak bisa menilai anak kelas lain'
);
update public.penilaian set status = 'belum' where generus_id = 'a0000000-0000-0000-0000-0000000000e1';
select is(
  (select status::text from public.penilaian where generus_id = 'a0000000-0000-0000-0000-0000000000e1'),
  'lancar', 'penilaian append-only: guru tidak bisa mengubah entri lama'
);
select lives_ok(
  $$ insert into public.capaian_tilawati (generus_id, jenis, tambahan, jilid, halaman)
     values ('a0000000-0000-0000-0000-0000000000e1', 'tambah', 2, 1, 12) $$,
  'guru: boleh mencatat tilawati +N'
);
select throws_ok(
  $$ insert into public.capaian_tilawati (generus_id, jenis, jilid, halaman)
     values ('a0000000-0000-0000-0000-0000000000e1', 'tambah', 1, 14) $$,
  '23514', null, 'tilawati: entri "tambah" wajib mengisi jumlah tambahan'
);
select lives_ok(
  $$ insert into public.target_bulanan (judul, mulai, selesai) values ('Periode Oktober (guru)', '2026-10-05', '2026-11-07') $$,
  'guru: boleh membuat target (rincian hak guru: 06_guru_kelola.sql)'
);
select lives_ok(
  $$ insert into public.catatan_raport (generus_id, bulan, catatan)
     values ('a0000000-0000-0000-0000-0000000000e1', '2026-10-01', 'Rajin') $$,
  'guru: boleh menulis catatan raport anak kelasnya'
);

-- ── Admin ───────────────────────────────────────────────────────────
set local request.jwt.claims to '{"sub":"a0000000-0000-0000-0000-0000000000a1","role":"authenticated"}';

select lives_ok(
  $$ insert into public.target_bulanan (judul, mulai, selesai) values ('Periode Oktober', '2026-10-05', '2026-11-07') $$,
  'admin: boleh menginput target bulanan'
);
select throws_ok(
  $$ insert into public.target_bulanan (judul, mulai, selesai) values ('Terbalik', '2026-11-07', '2026-10-05') $$,
  '23514', null, 'periode target: selesai tidak boleh sebelum mulai'
);

-- ── Pengurus ────────────────────────────────────────────────────────
set local request.jwt.claims to '{"sub":"a0000000-0000-0000-0000-0000000000a3","role":"authenticated"}';

select is((select count(*)::int from public.penilaian), 2, 'pengurus: melihat semua penilaian');
select lives_ok(
  $$ insert into public.catatan_raport (generus_id, bulan, catatan)
     values ('a0000000-0000-0000-0000-0000000000e2', '2026-10-01', 'Perlu pendampingan') $$,
  'pengurus: boleh menulis catatan raport'
);

-- ── Wali ────────────────────────────────────────────────────────────
set local request.jwt.claims to '{"sub":"a0000000-0000-0000-0000-0000000000a4","role":"authenticated"}';

select results_eq(
  $$ select generus_id::text from public.penilaian $$,
  $$ values ('a0000000-0000-0000-0000-0000000000e1') $$,
  'wali: hanya melihat penilaian anaknya'
);
select is((select count(*)::int from public.target_bulanan), 2, 'wali: boleh melihat target bulanan');

select * from finish();
rollback;
