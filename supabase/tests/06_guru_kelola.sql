-- Guru ikut mengelola materi item & target, terbatas pada kelas yang diajarnya.
-- Guru Satu mengajar K1 (Pelajar), Guru Dua mengajar K2 (Pra-nikah).
begin;
\ir _setup.psql
select plan(14);

insert into public.target_bulanan (id, kelompok_id, judul, mulai, selesai, dibuat_oleh) values
  ('a0000000-0000-0000-0000-000000000501', 'a0000000-0000-0000-0000-000000000000', 'Target K2 (dari admin)', '2026-10-05', '2026-11-07', 'a0000000-0000-0000-0000-0000000000a1'),
  ('a0000000-0000-0000-0000-000000000502', 'a0000000-0000-0000-0000-000000000000', 'Target gabungan', '2026-10-05', '2026-11-07', 'a0000000-0000-0000-0000-0000000000a1');
insert into public.target_bulanan_kelas (kelompok_id, target_bulanan_id, kelas_id) values
  ('a0000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000501', 'a0000000-0000-0000-0000-0000000000c2'),
  ('a0000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000502', 'a0000000-0000-0000-0000-0000000000c1');
insert into public.materi_item (id, kelompok_id, aspek, mapel, nama) values
  ('a0000000-0000-0000-0000-000000000511', 'a0000000-0000-0000-0000-000000000000', 'faqih', 'Kefahaman Agama', 'Rukun Iman');

-- ── Guru Satu ───────────────────────────────────────────────────────
set local role authenticated;
set local request.jwt.claims to '{"sub":"a0000000-0000-0000-0000-0000000000a2","role":"authenticated"}';

-- Materi item
select lives_ok(
  $$ insert into public.materi_item (aspek, mapel, nama) values ('alim', 'Hafalan', 'Asmaul Husna 1–99') $$,
  'guru: boleh menambah materi item'
);
update public.materi_item set nama = 'Memahami Rukun Iman' where id = 'a0000000-0000-0000-0000-000000000511';
select is(
  (select nama from public.materi_item where id = 'a0000000-0000-0000-0000-000000000511'),
  'Memahami Rukun Iman', 'guru: boleh mengubah materi item'
);

-- Target baru buatan sendiri
select lives_ok(
  $$ insert into public.target_bulanan (id, judul, mulai, selesai)
     values ('a0000000-0000-0000-0000-000000000503', 'Target Pelajar', '2026-11-08', '2026-12-05') $$,
  'guru: boleh membuat target'
);
select is(
  (select dibuat_oleh::text from public.target_bulanan where id = 'a0000000-0000-0000-0000-000000000503'),
  'a0000000-0000-0000-0000-0000000000a2', 'target mencatat pembuatnya'
);
select lives_ok(
  $$ insert into public.target_bulanan_kelas (target_bulanan_id, kelas_id)
     values ('a0000000-0000-0000-0000-000000000503', 'a0000000-0000-0000-0000-0000000000c1') $$,
  'guru: boleh menautkan target ke kelas yang diajarnya'
);
select throws_ok(
  $$ insert into public.target_bulanan_kelas (target_bulanan_id, kelas_id)
     values ('a0000000-0000-0000-0000-000000000503', 'a0000000-0000-0000-0000-0000000000c2') $$,
  '42501', null, 'guru: tidak bisa menautkan target ke kelas lain'
);
select lives_ok(
  $$ insert into public.target_materi (target_bulanan_id, materi_item_id)
     values ('a0000000-0000-0000-0000-000000000503', 'a0000000-0000-0000-0000-000000000511') $$,
  'guru: boleh mengisi materi target kelasnya'
);
select lives_ok(
  $$ insert into public.target_kitab (target_bulanan_id, kitab_id, mulai, selesai)
     values ('a0000000-0000-0000-0000-000000000502', 'a0000000-0000-0000-0000-0000000000f1', 26, 38) $$,
  'guru: boleh mengisi target yang mencakup kelasnya (buatan admin)'
);

-- Target kelas lain
select throws_ok(
  $$ insert into public.target_materi (target_bulanan_id, materi_item_id)
     values ('a0000000-0000-0000-0000-000000000501', 'a0000000-0000-0000-0000-000000000511') $$,
  '42501', null, 'guru: tidak bisa mengisi target kelas lain'
);
update public.target_bulanan set judul = 'Diubah guru' where id = 'a0000000-0000-0000-0000-000000000501';
select is(
  (select judul from public.target_bulanan where id = 'a0000000-0000-0000-0000-000000000501'),
  'Target K2 (dari admin)', 'guru: tidak bisa mengubah target kelas lain'
);
delete from public.target_bulanan_kelas where target_bulanan_id = 'a0000000-0000-0000-0000-000000000501';
select is(
  (select count(*)::int from public.target_bulanan_kelas where target_bulanan_id = 'a0000000-0000-0000-0000-000000000501'),
  1, 'guru: tidak bisa melepas kelas lain dari target'
);

-- Kitab & jadwal tetap admin
select throws_ok(
  $$ insert into public.kitab (nama, jenis, satuan, total_satuan) values ('K. Baru', 'hadist', 'halaman', 50) $$,
  '42501', null, 'guru: kitab tetap hanya admin'
);

-- ── Pengurus tetap hanya melihat ────────────────────────────────────
set local request.jwt.claims to '{"sub":"a0000000-0000-0000-0000-0000000000a3","role":"authenticated"}';
select throws_ok(
  $$ insert into public.target_bulanan (judul, mulai, selesai) values ('Pengurus', '2026-10-05', '2026-11-07') $$,
  '42501', null, 'pengurus: tidak bisa membuat target'
);
select throws_ok(
  $$ insert into public.materi_item (aspek, mapel, nama) values ('alim', 'Hafalan', 'X') $$,
  '42501', null, 'pengurus: tidak bisa menambah materi item'
);

select * from finish();
rollback;
