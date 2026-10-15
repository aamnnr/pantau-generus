-- Tahap 5: progres makna/bacaan, materi terlewat, susulan, kehadiran, penilaian, tilawati & RLS-nya.
begin;
\ir _setup.psql
select plan(22);

-- Kelas K1: kegiatan 6 Okt (hal. 1–10 + Al-Baqarah 1–5), 13 Okt (hal. 11–20), 20 Okt libur (hal. 21–30).
insert into public.kegiatan (id, kelompok_id, tanggal, status) values
  ('a0000000-0000-0000-0000-000000000901', 'a0000000-0000-0000-0000-000000000000', '2026-10-06', 'selesai'),
  ('a0000000-0000-0000-0000-000000000902', 'a0000000-0000-0000-0000-000000000000', '2026-10-13', 'selesai'),
  ('a0000000-0000-0000-0000-000000000903', 'a0000000-0000-0000-0000-000000000000', '2026-10-20', 'batal');
insert into public.kegiatan_kelas (kelompok_id, kegiatan_id, kelas_id) values
  ('a0000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000901', 'a0000000-0000-0000-0000-0000000000c1'),
  ('a0000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000902', 'a0000000-0000-0000-0000-0000000000c1'),
  ('a0000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000903', 'a0000000-0000-0000-0000-0000000000c1');
insert into public.kegiatan_materi (kelompok_id, kegiatan_id, kitab_id, jenis, mulai, selesai) values
  ('a0000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000901', 'a0000000-0000-0000-0000-0000000000f1', 'makna', 1, 10),
  ('a0000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000901',
   (select id from public.kitab where jenis = 'quran' and kelompok_id = 'a0000000-0000-0000-0000-000000000000'), 'makna', 8, 12),
  ('a0000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000902', 'a0000000-0000-0000-0000-0000000000f1', 'makna', 11, 20),
  ('a0000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000903', 'a0000000-0000-0000-0000-0000000000f1', 'makna', 21, 30);
insert into public.presensi (kelompok_id, kegiatan_id, generus_id, status) values
  ('a0000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000901', 'a0000000-0000-0000-0000-0000000000e1', 'hadir'),
  ('a0000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000902', 'a0000000-0000-0000-0000-0000000000e1', 'alpa'),
  ('a0000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000903', 'a0000000-0000-0000-0000-0000000000e1', 'hadir');
insert into public.materi_item (id, kelompok_id, aspek, mapel, nama) values
  ('a0000000-0000-0000-0000-000000000911', 'a0000000-0000-0000-0000-000000000000', 'alim', 'Hafalan', 'Doa Masuk Masjid');
insert into public.kegiatan_materi_item (kelompok_id, kegiatan_id, materi_item_id) values
  ('a0000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000901', 'a0000000-0000-0000-0000-000000000911');
insert into public.jilid_tilawati (kelompok_id, jilid, total_halaman) values
  ('a0000000-0000-0000-0000-000000000000', 1, 40);

set local role authenticated;
set local request.jwt.claims to '{"sub":"a0000000-0000-0000-0000-0000000000a2","role":"authenticated"}';

-- Progres & materi terlewat (kegiatan libur tidak dihitung)
select results_eq(
  $$ select diikuti, kelas, total, terlewat from public.fn_progres_anak('a0000000-0000-0000-0000-0000000000e1')
     where kitab_id = 'a0000000-0000-0000-0000-0000000000f1' $$,
  $$ values (10, 20, 100, '[{"mulai": 11, "selesai": 20, "teks": "hal. 11–20"}]'::jsonb) $$,
  'progres hadist: hadir 1 dari 2 kegiatan, libur diabaikan, terlewat hal. 11–20'
);

-- Susulan menambah progres anak dan memecah rentang terlewat
select lives_ok(
  $$ select public.simpan_susulan('a0000000-0000-0000-0000-0000000000e1',
       '{"kitab_id": "a0000000-0000-0000-0000-0000000000f1", "jenis": "makna", "mulai": 15, "selesai": 16}', '2026-10-15') $$,
  'guru: catat susulan anak kelasnya'
);
select results_eq(
  $$ select diikuti, terlewat from public.fn_progres_anak('a0000000-0000-0000-0000-0000000000e1')
     where kitab_id = 'a0000000-0000-0000-0000-0000000000f1' $$,
  $$ values (12, '[{"mulai": 11, "selesai": 14, "teks": "hal. 11–14"}, {"mulai": 17, "selesai": 20, "teks": "hal. 17–20"}]'::jsonb) $$,
  'susulan dihitung unik; terlewat menjadi dua rentang'
);
select results_eq(
  $$ select teks, guru_nama from public.v_susulan where generus_id = 'a0000000-0000-0000-0000-0000000000e1' $$,
  $$ values ('hal. 15–16', 'Guru Satu') $$,
  'v_susulan: guru pencatat terisi otomatis'
);
select results_eq(
  $$ select diikuti, kelas, terlewat from public.fn_progres_anak('a0000000-0000-0000-0000-0000000000e1')
     where kitab_jenis = 'quran' $$,
  $$ values (5, 5, '[]'::jsonb) $$,
  'progres Al-Qur''an'
);
select results_eq(
  $$ select nama, diikuti, kelas from public.fn_progres_quran_per_surat('a0000000-0000-0000-0000-0000000000e1', 'makna') $$,
  $$ values ('Al-Baqarah'::text, 5, 5) $$,
  'Al-Qur''an per surat'
);
select throws_ok(
  $$ select public.simpan_susulan('a0000000-0000-0000-0000-0000000000e1',
       '{"kitab_id": "a0000000-0000-0000-0000-0000000000f1", "mulai": 90, "selesai": 120}', null) $$,
  '23514', null, 'susulan melewati total halaman kitab ditolak'
);

-- Kehadiran
select results_eq(
  $$ select hadir, alpa, total, persen from public.fn_rekap_presensi('a0000000-0000-0000-0000-0000000000e1', '2026-10-01', '2026-10-31') $$,
  $$ values (1, 1, 2, 50) $$,
  'rekap presensi: 50%, kegiatan libur tidak dihitung'
);

-- Materi item: diterima & penilaian terakhir
select is(
  (select kali from public.v_materi_item_diterima
   where generus_id = 'a0000000-0000-0000-0000-0000000000e1' and materi_item_id = 'a0000000-0000-0000-0000-000000000911'),
  1, 'materi item diterima dari kegiatan yang dihadiri'
);
insert into public.penilaian (generus_id, materi_item_id, status, tanggal) values
  ('a0000000-0000-0000-0000-0000000000e1', 'a0000000-0000-0000-0000-000000000911', 'proses', '2026-10-06'),
  ('a0000000-0000-0000-0000-0000000000e1', 'a0000000-0000-0000-0000-000000000911', 'lancar', '2026-10-13');
select is(
  (select status::text from public.v_penilaian_terakhir
   where generus_id = 'a0000000-0000-0000-0000-0000000000e1' and materi_item_id = 'a0000000-0000-0000-0000-000000000911'),
  'lancar', 'penilaian terakhir yang berlaku'
);

-- Tilawati
select throws_ok(
  $$ select * from public.tambah_tilawati('a0000000-0000-0000-0000-0000000000e1', 2) $$,
  '22023', 'Posisi awal tilawati anak ini belum diisi', 'tambah tanpa posisi awal ditolak'
);
select lives_ok(
  $$ select public.atur_posisi_tilawati('a0000000-0000-0000-0000-0000000000e1', 1, 38) $$,
  'atur posisi awal'
);
select results_eq(
  $$ select jilid, halaman, total_halaman, sisa from public.tambah_tilawati('a0000000-0000-0000-0000-0000000000e1', 3, 'a0000000-0000-0000-0000-000000000902') $$,
  $$ values (1, 40, 40, 1) $$,
  '+3 di hal. 38: berhenti di akhir jilid, sisa 1'
);
select is(
  (select tanggal from public.capaian_tilawati where generus_id = 'a0000000-0000-0000-0000-0000000000e1' and jenis = 'tambah'),
  '2026-10-13'::date, 'tanggal capaian mengikuti kegiatan'
);
select throws_ok(
  $$ select public.atur_posisi_tilawati('a0000000-0000-0000-0000-0000000000e1', 2, 1, true) $$,
  '22023', null, 'naik ke jilid yang belum diatur ditolak'
);
select throws_ok(
  $$ select public.atur_posisi_tilawati('a0000000-0000-0000-0000-0000000000e1', 1, 41) $$,
  '22023', 'Jilid 1 hanya memiliki 40 halaman', 'halaman melebihi jilid ditolak'
);
select results_eq(
  $$ select jilid, halaman from public.v_posisi_tilawati where generus_id = 'a0000000-0000-0000-0000-0000000000e1' $$,
  $$ values (1::smallint, 40::smallint) $$,
  'posisi saat ini = entri terakhir'
);

-- Guru kelas lain
set local request.jwt.claims to '{"sub":"a0000000-0000-0000-0000-0000000000a5","role":"authenticated"}';
select is(
  (select count(*)::int from public.fn_progres_anak('a0000000-0000-0000-0000-0000000000e1')),
  0, 'guru kelas lain: tidak melihat progres anak'
);
select throws_ok(
  $$ select public.atur_posisi_tilawati('a0000000-0000-0000-0000-0000000000e1', 1, 1) $$,
  '42501', null, 'guru kelas lain: tidak bisa mencatat tilawati'
);
select throws_ok(
  $$ select public.simpan_susulan('a0000000-0000-0000-0000-0000000000e1',
       '{"kitab_id": "a0000000-0000-0000-0000-0000000000f1", "mulai": 11, "selesai": 12}', null) $$,
  '42501', null, 'guru kelas lain: tidak bisa mencatat susulan'
);

-- Wali melihat progres anaknya, tetapi tidak bisa menilai
set local request.jwt.claims to '{"sub":"a0000000-0000-0000-0000-0000000000a4","role":"authenticated"}';
select results_eq(
  $$ select diikuti, kelas from public.fn_progres_anak('a0000000-0000-0000-0000-0000000000e1')
     where kitab_id = 'a0000000-0000-0000-0000-0000000000f1' $$,
  $$ values (12, 20) $$,
  'wali: melihat progres anaknya'
);
select throws_ok(
  $$ insert into public.penilaian (generus_id, materi_item_id, status)
     values ('a0000000-0000-0000-0000-0000000000e1', 'a0000000-0000-0000-0000-000000000911', 'belum') $$,
  '42501', null, 'wali: tidak bisa menilai'
);

select * from finish();
rollback;
