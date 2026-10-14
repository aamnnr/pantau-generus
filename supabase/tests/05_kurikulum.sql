-- Format kurikulum PPG: aspek/mapel materi, makna vs bacaan, target berperiode untuk ≥1 kelas.
begin;
\ir _setup.psql
select plan(12);

-- ── Materi item ─────────────────────────────────────────────────────
select lives_ok(
  $$ insert into public.materi_item (kelompok_id, aspek, mapel, nama, jenis_kelamin)
     values ('a0000000-0000-0000-0000-000000000000', 'mandiri', 'Kemandirian', 'Mengenal instalasi listrik', 'laki_laki') $$,
  'materi item bisa khusus putra'
);
select throws_ok(
  $$ insert into public.materi_item (kelompok_id, aspek, mapel, nama)
     values ('a0000000-0000-0000-0000-000000000000', 'alim', '  ', 'Tanpa mapel') $$,
  '23514', null, 'mapel wajib diisi'
);
select throws_ok(
  $$ insert into public.materi_item (kelompok_id, aspek, mapel, nama)
     values ('a0000000-0000-0000-0000-000000000000', 'faqih', 'Akhlaq', 'x'),
            ('a0000000-0000-0000-0000-000000000000', 'faqih', 'Akhlaq', 'x') $$,
  '23505', null, 'materi item unik per aspek + mapel + nama'
);

-- ── Makna vs bacaan ─────────────────────────────────────────────────
insert into public.kegiatan (id, kelompok_id, tanggal) values
  ('a0000000-0000-0000-0000-000000000101', 'a0000000-0000-0000-0000-000000000000', '2026-10-13');

select lives_ok(
  $$ insert into public.kegiatan_materi (kelompok_id, kegiatan_id, kitab_id, jenis, mulai, selesai)
     select 'a0000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000101', id, 'bacaan', 260, 300
     from public.kitab where kelompok_id = 'a0000000-0000-0000-0000-000000000000' and jenis = 'quran' $$,
  'bacaan Al-Qur''an diterima'
);
select is(
  (select jenis::text from public.kegiatan_materi where kegiatan_id = 'a0000000-0000-0000-0000-000000000101'),
  'bacaan', 'jenis bacaan tersimpan'
);
select throws_ok(
  $$ insert into public.kegiatan_materi (kelompok_id, kegiatan_id, kitab_id, jenis, mulai, selesai)
     values ('a0000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000101', 'a0000000-0000-0000-0000-0000000000f1', 'bacaan', 1, 5) $$,
  '23514', null, 'bacaan untuk kitab hadist ditolak'
);
select is(
  (select column_default from information_schema.columns
   where table_schema = 'public' and table_name = 'susulan' and column_name = 'jenis'),
  '''makna''::jenis_materi_kitab', 'susulan default ke makna'
);

-- ── Target berperiode untuk beberapa kelas ──────────────────────────
insert into public.target_bulanan (id, kelompok_id, judul, semester, mulai, selesai) values
  ('a0000000-0000-0000-0000-000000000401', 'a0000000-0000-0000-0000-000000000000', 'Periode Bulan Oktober', 'Semester 1 - 2026', '2026-10-05', '2026-11-07'),
  ('a0000000-0000-0000-0000-000000000402', 'a0000000-0000-0000-0000-000000000000', 'Periode Bulan November', 'Semester 1 - 2026', '2026-11-08', '2026-12-05');

select lives_ok(
  $$ insert into public.target_bulanan_kelas (kelompok_id, target_bulanan_id, kelas_id) values
       ('a0000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000401', 'a0000000-0000-0000-0000-0000000000c1'),
       ('a0000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000401', 'a0000000-0000-0000-0000-0000000000c2'),
       ('a0000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000402', 'a0000000-0000-0000-0000-0000000000c1') $$,
  'satu target untuk dua kelas; periode berurutan tidak bentrok'
);
select throws_ok(
  $$ update public.target_bulanan set mulai = '2026-11-01' where id = 'a0000000-0000-0000-0000-000000000402' $$,
  '23P01', null, 'mengubah periode hingga bertumpukan ditolak'
);
insert into public.target_bulanan (id, kelompok_id, judul, mulai, selesai) values
  ('a0000000-0000-0000-0000-000000000403', 'a0000000-0000-0000-0000-000000000000', 'Bentrok', '2026-10-20', '2026-10-30');
select throws_ok(
  $$ insert into public.target_bulanan_kelas (kelompok_id, target_bulanan_id, kelas_id)
     values ('a0000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000403', 'a0000000-0000-0000-0000-0000000000c2') $$,
  '23P01', null, 'kelas dengan periode target bertumpukan ditolak'
);

-- RLS: guru melihat tapi tidak bisa menautkan target ke kelas.
set local role authenticated;
set local request.jwt.claims to '{"sub":"a0000000-0000-0000-0000-0000000000a2","role":"authenticated"}';

select is((select count(*)::int from public.target_bulanan_kelas), 3, 'guru: melihat target per kelas');
select throws_ok(
  $$ insert into public.target_bulanan_kelas (target_bulanan_id, kelas_id)
     values ('a0000000-0000-0000-0000-000000000403', 'a0000000-0000-0000-0000-0000000000c1') $$,
  '42501', null, 'guru: tidak bisa menautkan target ke kelas'
);

select * from finish();
rollback;
