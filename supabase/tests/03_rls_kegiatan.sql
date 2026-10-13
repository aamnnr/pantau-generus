-- RLS kegiatan, presensi, susulan + kegiatan gabungan + siapkan_kegiatan().
begin;
\ir _setup.psql
select plan(21);

-- Kegiatan K1 (Guru Satu), kegiatan K2 (Guru Dua), kegiatan gabungan K1+K2.
insert into public.kegiatan (id, kelompok_id, tanggal, jenis) values
  ('a0000000-0000-0000-0000-000000000101', 'a0000000-0000-0000-0000-000000000000', '2026-10-13', 'khusus'),
  ('a0000000-0000-0000-0000-000000000102', 'a0000000-0000-0000-0000-000000000000', '2026-10-13', 'khusus'),
  ('a0000000-0000-0000-0000-000000000103', 'a0000000-0000-0000-0000-000000000000', '2026-10-14', 'khusus');
insert into public.kegiatan_kelas (kelompok_id, kegiatan_id, kelas_id) values
  ('a0000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000101', 'a0000000-0000-0000-0000-0000000000c1'),
  ('a0000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000102', 'a0000000-0000-0000-0000-0000000000c2'),
  ('a0000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000103', 'a0000000-0000-0000-0000-0000000000c1'),
  ('a0000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000103', 'a0000000-0000-0000-0000-0000000000c2');
insert into public.presensi (kelompok_id, kegiatan_id, generus_id, status) values
  ('a0000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000103', 'a0000000-0000-0000-0000-0000000000e1', 'hadir'),
  ('a0000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000103', 'a0000000-0000-0000-0000-0000000000e2', 'izin');

-- Jadwal rutin Selasa untuk K1 dengan guru default.
insert into public.jadwal_rutin (id, kelompok_id, hari, jam_mulai, guru_id) values
  ('a0000000-0000-0000-0000-000000000201', 'a0000000-0000-0000-0000-000000000000', 2, '19:30', 'a0000000-0000-0000-0000-0000000000d1');
insert into public.jadwal_rutin_kelas (kelompok_id, jadwal_rutin_id, kelas_id) values
  ('a0000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000201', 'a0000000-0000-0000-0000-0000000000c1');

-- ── Guru Satu ───────────────────────────────────────────────────────
set local role authenticated;
set local request.jwt.claims to '{"sub":"a0000000-0000-0000-0000-0000000000a2","role":"authenticated"}';

select set_eq(
  $$ select id::text from public.kegiatan $$,
  $$ values ('a0000000-0000-0000-0000-000000000101'), ('a0000000-0000-0000-0000-000000000103') $$,
  'guru: melihat kegiatan kelasnya + kegiatan gabungan'
);
select is((select count(*)::int from public.presensi), 2, 'guru: melihat presensi kegiatan gabungan untuk semua peserta');
select lives_ok(
  $$ update public.presensi set status = 'terlambat'
     where kegiatan_id = 'a0000000-0000-0000-0000-000000000103' and generus_id = 'a0000000-0000-0000-0000-0000000000e2' $$,
  'guru: boleh mengubah presensi kegiatan gabungan (mengajar salah satu kelas)'
);
select is(
  (select diubah_oleh::text from public.presensi
   where kegiatan_id = 'a0000000-0000-0000-0000-000000000103' and generus_id = 'a0000000-0000-0000-0000-0000000000e2'),
  'a0000000-0000-0000-0000-0000000000a2', 'presensi mencatat siapa yang mengubah'
);
select throws_ok(
  $$ insert into public.presensi (kegiatan_id, generus_id, status)
     values ('a0000000-0000-0000-0000-000000000102', 'a0000000-0000-0000-0000-0000000000e2', 'hadir') $$,
  '42501', null, 'guru: tidak bisa mengisi presensi kegiatan kelas lain'
);
select lives_ok(
  $$ insert into public.kegiatan (id, tanggal, judul) values ('a0000000-0000-0000-0000-000000000104', '2026-10-20', 'Khusus Guru') $$,
  'guru: boleh membuat kegiatan khusus'
);
select lives_ok(
  $$ insert into public.kegiatan_kelas (kegiatan_id, kelas_id)
     values ('a0000000-0000-0000-0000-000000000104', 'a0000000-0000-0000-0000-0000000000c1') $$,
  'guru: boleh menautkan kelas yang diajarnya'
);
select throws_ok(
  $$ insert into public.kegiatan_kelas (kegiatan_id, kelas_id)
     values ('a0000000-0000-0000-0000-000000000104', 'a0000000-0000-0000-0000-0000000000c2') $$,
  '42501', null, 'guru: tidak bisa menautkan kelas yang tidak diajarnya'
);
select lives_ok(
  $$ insert into public.kegiatan_materi (kegiatan_id, kitab_id, mulai, selesai)
     values ('a0000000-0000-0000-0000-000000000104', 'a0000000-0000-0000-0000-0000000000f1', 15, 20) $$,
  'guru: boleh mengisi materi kegiatannya'
);
select lives_ok(
  $$ insert into public.susulan (generus_id, kitab_id, mulai, selesai)
     values ('a0000000-0000-0000-0000-0000000000e1', 'a0000000-0000-0000-0000-0000000000f1', 1, 5) $$,
  'guru: boleh mencatat susulan anak kelasnya'
);
select throws_ok(
  $$ insert into public.susulan (generus_id, kitab_id, mulai, selesai)
     values ('a0000000-0000-0000-0000-0000000000e2', 'a0000000-0000-0000-0000-0000000000f1', 1, 5) $$,
  '42501', null, 'guru: tidak bisa mencatat susulan anak kelas lain'
);
select throws_ok(
  $$ insert into public.jadwal_rutin (hari, jam_mulai) values (3, '19:30') $$,
  '42501', null, 'guru: tidak bisa membuat jadwal rutin'
);

-- 2026-10-13 adalah Selasa → jadwal K1 menghasilkan satu kegiatan rutin, idempoten.
select is(public.siapkan_kegiatan('2026-10-13'), 1, 'siapkan_kegiatan: membuat kegiatan dari jadwal');
select is(public.siapkan_kegiatan('2026-10-13'), 0, 'siapkan_kegiatan: idempoten');
select is(
  (select count(*)::int from public.kegiatan_pengajar kp join public.kegiatan k on k.id = kp.kegiatan_id
   where k.jadwal_rutin_id = 'a0000000-0000-0000-0000-000000000201'),
  1, 'siapkan_kegiatan: guru default menjadi pengajar'
);
select is(public.siapkan_kegiatan('2026-10-14'), 0, 'siapkan_kegiatan: hari tanpa jadwal tidak membuat apa pun');

-- ── Pengurus ────────────────────────────────────────────────────────
set local request.jwt.claims to '{"sub":"a0000000-0000-0000-0000-0000000000a3","role":"authenticated"}';

select is((select count(*)::int from public.kegiatan), 5, 'pengurus: melihat semua kegiatan');
select throws_ok(
  $$ insert into public.presensi (kegiatan_id, generus_id, status)
     values ('a0000000-0000-0000-0000-000000000101', 'a0000000-0000-0000-0000-0000000000e1', 'hadir') $$,
  '42501', null, 'pengurus: tidak bisa mengisi presensi'
);

-- ── Wali (anak1 di K1) ──────────────────────────────────────────────
set local request.jwt.claims to '{"sub":"a0000000-0000-0000-0000-0000000000a4","role":"authenticated"}';

select results_eq(
  $$ select generus_id::text from public.presensi $$,
  $$ values ('a0000000-0000-0000-0000-0000000000e1') $$,
  'wali: hanya melihat presensi anaknya, bukan teman sekelas'
);
select ok(
  not exists (select 1 from public.kegiatan where id = 'a0000000-0000-0000-0000-000000000102'),
  'wali: tidak melihat kegiatan kelas lain'
);
select throws_ok(
  $$ insert into public.presensi (kegiatan_id, generus_id, status)
     values ('a0000000-0000-0000-0000-000000000101', 'a0000000-0000-0000-0000-0000000000e1', 'hadir') $$,
  '42501', null, 'wali: tidak bisa mengisi presensi'
);

select * from finish();
rollback;
