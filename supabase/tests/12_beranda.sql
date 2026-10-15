-- Beranda: kehadiran harian per peran; rentang usia target.
begin;
\ir _setup.psql
select plan(6);

insert into public.kegiatan (id, kelompok_id, tanggal) values
  ('a0000000-0000-0000-0000-000000000b01', 'a0000000-0000-0000-0000-000000000000', '2026-10-13'),
  ('a0000000-0000-0000-0000-000000000b02', 'a0000000-0000-0000-0000-000000000000', '2026-10-13');
insert into public.kegiatan_kelas (kelompok_id, kegiatan_id, kelas_id) values
  ('a0000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000b01', 'a0000000-0000-0000-0000-0000000000c1'),
  ('a0000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000b02', 'a0000000-0000-0000-0000-0000000000c2');
insert into public.presensi (kelompok_id, kegiatan_id, generus_id, status) values
  ('a0000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000b01', 'a0000000-0000-0000-0000-0000000000e1', 'hadir'),
  ('a0000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000b02', 'a0000000-0000-0000-0000-0000000000e2', 'alpa');

set local role authenticated;
set local request.jwt.claims to '{"sub":"a0000000-0000-0000-0000-0000000000a1","role":"authenticated"}';
select results_eq(
  $$ select tanggal, hadir, total, persen from public.fn_kehadiran_harian('2026-10-12', '2026-10-13') $$,
  $$ values ('2026-10-12'::date, 0, 0, null::integer), ('2026-10-13'::date, 1, 2, 50) $$,
  'admin: semua kelas, hari tanpa kegiatan tetap muncul'
);

select results_eq(
  $$ select hadir, total from public.fn_kehadiran_harian('2026-10-13', '2026-10-13', array['a0000000-0000-0000-0000-0000000000c2']::uuid[]) $$,
  $$ values (0, 1) $$,
  'filter kelas: hanya anak kelas tsb.'
);

set local request.jwt.claims to '{"sub":"a0000000-0000-0000-0000-0000000000a2","role":"authenticated"}';
select results_eq(
  $$ select hadir, total, persen from public.fn_kehadiran_harian('2026-10-13', '2026-10-13') $$,
  $$ values (1, 1, 100) $$,
  'guru: hanya kelasnya'
);

set local request.jwt.claims to '{"sub":"b0000000-0000-0000-0000-0000000000b1","role":"authenticated"}';
select results_eq(
  $$ select total from public.fn_kehadiran_harian('2026-10-13', '2026-10-13') $$,
  $$ values (0) $$,
  'kelompok lain: tidak melihat'
);

-- Rentang usia target Caberawit (keterangan)
set local request.jwt.claims to '{"sub":"a0000000-0000-0000-0000-0000000000a1","role":"authenticated"}';
select lives_ok(
  $$ insert into public.target_bulanan (judul, mulai, selesai, rentang_usia) values ('Caberawit', '2026-10-01', '2026-10-31', 'Usia 6–7 tahun') $$,
  'target dengan rentang usia'
);
select throws_ok(
  $$ insert into public.target_bulanan (judul, mulai, selesai, rentang_usia) values ('X', '2026-10-01', '2026-10-31', '   ') $$,
  '23514', null, 'rentang usia kosong ditolak'
);

select * from finish();
rollback;
