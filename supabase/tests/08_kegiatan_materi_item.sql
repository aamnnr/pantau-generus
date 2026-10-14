-- Materi item yang disampaikan di kegiatan: simpan atomik, RLS, butir target periode.
begin;
\ir _setup.psql
select plan(9);

insert into public.materi_item (id, kelompok_id, aspek, mapel, nama) values
  ('a0000000-0000-0000-0000-000000000701', 'a0000000-0000-0000-0000-000000000000', 'faqih', 'Kefahaman Agama', 'Rukun Iman'),
  ('a0000000-0000-0000-0000-000000000702', 'a0000000-0000-0000-0000-000000000000', 'alim', 'Hafalan', 'Doa makan'),
  ('a0000000-0000-0000-0000-000000000703', 'a0000000-0000-0000-0000-000000000000', 'akhlaqul_karimah', 'Tata Krama', 'Salam');
insert into public.kegiatan (id, kelompok_id, tanggal) values
  ('a0000000-0000-0000-0000-000000000711', 'a0000000-0000-0000-0000-000000000000', '2026-10-14'),
  ('a0000000-0000-0000-0000-000000000712', 'a0000000-0000-0000-0000-000000000000', '2026-10-14');
insert into public.kegiatan_kelas (kelompok_id, kegiatan_id, kelas_id) values
  ('a0000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000711', 'a0000000-0000-0000-0000-0000000000c1'),
  ('a0000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000712', 'a0000000-0000-0000-0000-0000000000c2');
insert into public.target_bulanan (id, kelompok_id, judul, mulai, selesai) values
  ('a0000000-0000-0000-0000-000000000721', 'a0000000-0000-0000-0000-000000000000', 'Oktober', '2026-10-05', '2026-11-07');
insert into public.target_bulanan_kelas (kelompok_id, target_bulanan_id, kelas_id) values
  ('a0000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000721', 'a0000000-0000-0000-0000-0000000000c1');
insert into public.target_materi (kelompok_id, target_bulanan_id, materi_item_id) values
  ('a0000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000721', 'a0000000-0000-0000-0000-000000000701');

set local role authenticated;
set local request.jwt.claims to '{"sub":"a0000000-0000-0000-0000-0000000000a2","role":"authenticated"}';

select results_eq(
  $$ select * from public.materi_item_target_kegiatan('a0000000-0000-0000-0000-000000000711') $$,
  $$ values ('a0000000-0000-0000-0000-000000000701'::uuid) $$,
  'butir target periode kelas kegiatan terdeteksi'
);
select is_empty(
  $$ select * from public.materi_item_target_kegiatan('a0000000-0000-0000-0000-000000000712') $$,
  'kelas tanpa target → tidak ada butir target'
);
select lives_ok(
  $$ select public.simpan_materi_item_kegiatan('a0000000-0000-0000-0000-000000000711',
       array['a0000000-0000-0000-0000-000000000701', 'a0000000-0000-0000-0000-000000000702']::uuid[]) $$,
  'guru: simpan materi item kegiatan kelasnya'
);
select lives_ok(
  $$ select public.simpan_materi_item_kegiatan('a0000000-0000-0000-0000-000000000711',
       array['a0000000-0000-0000-0000-000000000702', 'a0000000-0000-0000-0000-000000000703']::uuid[]) $$,
  'simpan ulang mengganti pilihan'
);
select set_eq(
  $$ select materi_item_id from public.kegiatan_materi_item where kegiatan_id = 'a0000000-0000-0000-0000-000000000711' $$,
  $$ values ('a0000000-0000-0000-0000-000000000702'::uuid), ('a0000000-0000-0000-0000-000000000703'::uuid) $$,
  'pilihan lama terganti'
);
select is(
  (select jumlah_materi_item from public.v_kegiatan_ringkas where id = 'a0000000-0000-0000-0000-000000000711'),
  2, 'v_kegiatan_ringkas menghitung materi item'
);
select throws_ok(
  $$ select public.simpan_materi_item_kegiatan('a0000000-0000-0000-0000-000000000712', array['a0000000-0000-0000-0000-000000000701']::uuid[]) $$,
  '42501', null, 'guru: tidak bisa mengubah kegiatan kelas lain'
);

set local request.jwt.claims to '{"sub":"a0000000-0000-0000-0000-0000000000a4","role":"authenticated"}';
select is(
  (select count(*)::int from public.kegiatan_materi_item),
  2, 'wali: melihat materi item kegiatan kelas anaknya'
);
select throws_ok(
  $$ insert into public.kegiatan_materi_item (kegiatan_id, materi_item_id)
     values ('a0000000-0000-0000-0000-000000000711', 'a0000000-0000-0000-0000-000000000701') $$,
  '42501', null, 'wali: tidak bisa menambah materi item kegiatan'
);

select * from finish();
rollback;
