-- Tahap 4: simpan isi target (bacaan/makna/materi/tilawati), salin periode, ringkasan & RLS.
begin;
\ir _setup.psql
select plan(15);

insert into public.materi_item (id, kelompok_id, aspek, mapel, nama) values
  ('a0000000-0000-0000-0000-000000000801', 'a0000000-0000-0000-0000-000000000000', 'faqih', 'Kefahaman Agama', 'Rukun Iman'),
  ('a0000000-0000-0000-0000-000000000802', 'a0000000-0000-0000-0000-000000000000', 'alim', 'Hafalan', 'Asmaul Husna');
insert into public.target_bulanan (id, kelompok_id, judul, mulai, selesai) values
  ('a0000000-0000-0000-0000-000000000811', 'a0000000-0000-0000-0000-000000000000', 'Oktober', '2026-10-05', '2026-11-07'),
  ('a0000000-0000-0000-0000-000000000812', 'a0000000-0000-0000-0000-000000000000', 'November', '2026-11-08', '2026-12-05'),
  ('a0000000-0000-0000-0000-000000000813', 'a0000000-0000-0000-0000-000000000000', 'Kelas lain', '2026-10-05', '2026-11-07');
insert into public.target_bulanan_kelas (kelompok_id, target_bulanan_id, kelas_id) values
  ('a0000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000811', 'a0000000-0000-0000-0000-0000000000c1'),
  ('a0000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000812', 'a0000000-0000-0000-0000-0000000000c1'),
  ('a0000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000813', 'a0000000-0000-0000-0000-0000000000c2');

set local role authenticated;
set local request.jwt.claims to '{"sub":"a0000000-0000-0000-0000-0000000000a2","role":"authenticated"}';

-- Isi sesuai contoh dokumen PPG Remaja Oktober.
select lives_ok(
  $$ select public.simpan_isi_target('a0000000-0000-0000-0000-000000000811',
       jsonb_build_array(
         jsonb_build_object('kitab_id', (select id from public.kitab where jenis = 'quran'), 'jenis', 'bacaan',
                            'mulai_surat', 2, 'mulai_ayat', 253, 'selesai_surat', 3, 'selesai_ayat', 91),
         jsonb_build_object('kitab_id', (select id from public.kitab where jenis = 'quran'), 'jenis', 'makna',
                            'mulai_surat', 7, 'mulai_ayat', 144, 'selesai_ayat', 187),
         jsonb_build_object('kitab_id', 'a0000000-0000-0000-0000-0000000000f1', 'jenis', 'makna', 'mulai', 26, 'selesai', 38)),
       array['a0000000-0000-0000-0000-000000000801', 'a0000000-0000-0000-0000-000000000802']::uuid[],
       jsonb_build_object('jilid', 3, 'halaman', 20)) $$,
  'guru: simpan isi target kelasnya'
);
select results_eq(
  $$ select jenis::text, teks from public.v_target_kitab
     where target_bulanan_id = 'a0000000-0000-0000-0000-000000000811' order by urutan $$,
  $$ values ('bacaan', 'Al-Baqarah 253 – Ali ''Imran 91'), ('makna', 'Al-A''raf 144–187'), ('makna', 'hal. 26–38') $$,
  'v_target_kitab: teks rentang bacaan & makna'
);
select results_eq(
  $$ select jumlah_kitab, jumlah_materi, ada_tilawati, boleh_kelola from public.v_target_ringkas
     where id = 'a0000000-0000-0000-0000-000000000811' $$,
  $$ values (3, 2, true, true) $$,
  'v_target_ringkas: jumlah isi & hak kelola'
);
select lives_ok(
  $$ select public.simpan_isi_target('a0000000-0000-0000-0000-000000000811',
       jsonb_build_array(jsonb_build_object('kitab_id', 'a0000000-0000-0000-0000-0000000000f1', 'mulai', 26, 'selesai', 38)),
       array['a0000000-0000-0000-0000-000000000801']::uuid[], null) $$,
  'simpan ulang mengganti isi'
);
select results_eq(
  $$ select jumlah_kitab, jumlah_materi, ada_tilawati from public.v_target_ringkas where id = 'a0000000-0000-0000-0000-000000000811' $$,
  $$ values (1, 1, false) $$,
  'isi lama terganti; tilawati null = dihapus'
);
select throws_ok(
  $$ select public.simpan_isi_target('a0000000-0000-0000-0000-000000000811',
       jsonb_build_array(jsonb_build_object('kitab_id', 'a0000000-0000-0000-0000-0000000000f1', 'jenis', 'bacaan', 'mulai', 1, 'selesai', 2)),
       '{}', null) $$,
  '23514', null, 'bacaan untuk kitab hadist ditolak'
);
select throws_ok(
  $$ select public.simpan_isi_target('a0000000-0000-0000-0000-000000000811',
       jsonb_build_array(jsonb_build_object('kitab_id', 'a0000000-0000-0000-0000-0000000000f1', 'mulai', 38, 'selesai', 26)),
       '{}', null) $$,
  '22023', 'Baris 1: "sampai" harus sesudah "dari"', 'rentang terbalik ditolak'
);
select is(
  (select jumlah_kitab from public.v_target_ringkas where id = 'a0000000-0000-0000-0000-000000000811'),
  1, 'galat tidak mengubah isi (atomik)'
);

-- Salin ke periode berikutnya
select lives_ok(
  $$ select public.salin_isi_target('a0000000-0000-0000-0000-000000000811', 'a0000000-0000-0000-0000-000000000812') $$,
  'salin isi dari periode sebelumnya'
);
select results_eq(
  $$ select jumlah_kitab, jumlah_materi from public.v_target_ringkas where id = 'a0000000-0000-0000-0000-000000000812' $$,
  $$ values (1, 1) $$,
  'isi tersalin'
);

-- Target kelas lain
select throws_ok(
  $$ select public.simpan_isi_target('a0000000-0000-0000-0000-000000000813', '[]', '{}', null) $$,
  '42501', null, 'guru: tidak bisa mengisi target kelas lain'
);
select throws_ok(
  $$ select public.salin_isi_target('a0000000-0000-0000-0000-000000000811', 'a0000000-0000-0000-0000-000000000813') $$,
  '42501', null, 'guru: tidak bisa menyalin ke target kelas lain'
);
select is(
  (select boleh_kelola from public.v_target_ringkas where id = 'a0000000-0000-0000-0000-000000000813'),
  false, 'v_target_ringkas: guru tidak bisa kelola target kelas lain'
);

-- Wali hanya melihat
set local request.jwt.claims to '{"sub":"a0000000-0000-0000-0000-0000000000a4","role":"authenticated"}';
select is((select count(*)::int from public.v_target_ringkas), 3, 'wali: melihat daftar target');
select throws_ok(
  $$ select public.simpan_isi_target('a0000000-0000-0000-0000-000000000811', '[]', '{}', null) $$,
  '42501', null, 'wali: tidak bisa mengubah isi target'
);

select * from finish();
rollback;
