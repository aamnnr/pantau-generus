-- Tahap 6: progres per periode & rekap kelas.
begin;
\ir _setup.psql
select plan(8);

-- K1: 10 Sep hal. 1–5, 6 Okt hal. 6–10, 13 Okt hal. 11–20. Anak Satu: hadir, alpa, hadir; susulan hal. 6–7 pada 2 Nov.
insert into public.kegiatan (id, kelompok_id, tanggal, status) values
  ('a0000000-0000-0000-0000-000000000a01', 'a0000000-0000-0000-0000-000000000000', '2026-09-10', 'selesai'),
  ('a0000000-0000-0000-0000-000000000a02', 'a0000000-0000-0000-0000-000000000000', '2026-10-06', 'selesai'),
  ('a0000000-0000-0000-0000-000000000a03', 'a0000000-0000-0000-0000-000000000000', '2026-10-13', 'selesai');
insert into public.kegiatan_kelas (kelompok_id, kegiatan_id, kelas_id) values
  ('a0000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000a01', 'a0000000-0000-0000-0000-0000000000c1'),
  ('a0000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000a02', 'a0000000-0000-0000-0000-0000000000c1'),
  ('a0000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000a03', 'a0000000-0000-0000-0000-0000000000c1');
insert into public.kegiatan_materi (kelompok_id, kegiatan_id, kitab_id, jenis, mulai, selesai) values
  ('a0000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000a01', 'a0000000-0000-0000-0000-0000000000f1', 'makna', 1, 5),
  ('a0000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000a02', 'a0000000-0000-0000-0000-0000000000f1', 'makna', 6, 10),
  ('a0000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000a03', 'a0000000-0000-0000-0000-0000000000f1', 'makna', 11, 20);
insert into public.presensi (kelompok_id, kegiatan_id, generus_id, status) values
  ('a0000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000a01', 'a0000000-0000-0000-0000-0000000000e1', 'hadir'),
  ('a0000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000a02', 'a0000000-0000-0000-0000-0000000000e1', 'alpa'),
  ('a0000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000a03', 'a0000000-0000-0000-0000-0000000000e1', 'hadir');
insert into public.susulan (kelompok_id, generus_id, kitab_id, jenis, mulai, selesai, tanggal) values
  ('a0000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-0000000000e1', 'a0000000-0000-0000-0000-0000000000f1', 'makna', 6, 7, '2026-11-02');
insert into public.materi_item (id, kelompok_id, aspek, mapel, nama) values
  ('a0000000-0000-0000-0000-000000000a11', 'a0000000-0000-0000-0000-000000000000', 'faqih', 'Kefahaman Agama', 'Rukun Islam');
insert into public.target_bulanan (id, kelompok_id, judul, mulai, selesai) values
  ('a0000000-0000-0000-0000-000000000a21', 'a0000000-0000-0000-0000-000000000000', 'Oktober', '2026-10-05', '2026-11-07');
insert into public.target_bulanan_kelas (kelompok_id, target_bulanan_id, kelas_id) values
  ('a0000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000a21', 'a0000000-0000-0000-0000-0000000000c1');
insert into public.target_materi (kelompok_id, target_bulanan_id, materi_item_id) values
  ('a0000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000a21', 'a0000000-0000-0000-0000-000000000a11');
insert into public.penilaian (kelompok_id, generus_id, materi_item_id, status) values
  ('a0000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-0000000000e1', 'a0000000-0000-0000-0000-000000000a11', 'lancar');

set local role authenticated;
set local request.jwt.claims to '{"sub":"a0000000-0000-0000-0000-0000000000a2","role":"authenticated"}';

select results_eq(
  $$ select diikuti, kelas, terlewat from public.fn_progres_anak('a0000000-0000-0000-0000-0000000000e1', '2026-10-01', '2026-10-31') $$,
  $$ values (10, 15, '[{"mulai": 8, "selesai": 10, "teks": "hal. 8–10"}]'::jsonb) $$,
  'Oktober: diikuti & kelas hanya bulan itu; susulan November tetap menutup terlewat'
);
select results_eq(
  $$ select diikuti, kelas from public.fn_progres_anak('a0000000-0000-0000-0000-0000000000e1') $$,
  $$ values (17, 20) $$,
  'keseluruhan (argumen lama tetap berlaku)'
);
select results_eq(
  $$ select hadir, total, persen, perlu_perhatian, satuan_kelas, satuan_diikuti, butir_target, butir_tuntas
     from public.fn_rekap_kelas('a0000000-0000-0000-0000-0000000000c1', '2026-10-01', '2026-10-31') $$,
  $$ values (1, 2, 50, true, 15, 10, 1, 1) $$,
  'rekap kelas Oktober per anak'
);
select results_eq(
  $$ select satuan_kelas, satuan_diikuti, butir_target
     from public.fn_rekap_kelas('a0000000-0000-0000-0000-0000000000c1', '2026-09-01', '2026-09-30') $$,
  $$ values (5, 5, 0) $$,
  'rekap September: target Oktober tidak ikut'
);
select results_eq(
  $$ select jumlah_anak, rata_kehadiran, rata_ketuntasan, rata_target, perlu_perhatian
     from public.fn_rekap_kelas_ringkas('a0000000-0000-0000-0000-0000000000c1', '2026-10-01', '2026-10-31') $$,
  $$ values (1, 50, 67, 100, 1) $$,
  'ringkasan kelas'
);
select is(
  (select count(*)::int from public.fn_rekap_kelas('a0000000-0000-0000-0000-0000000000c2', '2026-10-01', '2026-10-31')),
  0, 'guru: kelas lain tidak terlihat'
);

set local request.jwt.claims to '{"sub":"a0000000-0000-0000-0000-0000000000a3","role":"authenticated"}';
select is(
  (select count(*)::int from public.fn_rekap_kelas('a0000000-0000-0000-0000-0000000000c1', '2026-10-01', '2026-10-31')),
  1, 'pengurus: melihat rekap'
);

set local request.jwt.claims to '{"sub":"b0000000-0000-0000-0000-0000000000b1","role":"authenticated"}';
select is(
  (select count(*)::int from public.fn_rekap_kelas('a0000000-0000-0000-0000-0000000000c1', '2026-10-01', '2026-10-31')),
  0, 'kelompok lain: tidak melihat rekap'
);

select * from finish();
rollback;
