-- Fungsi & view Tahap 3: ringkasan kegiatan, simpan materi (konversi surat:ayat), simpan rundown.
begin;
\ir _setup.psql
select plan(14);

insert into public.kegiatan (id, kelompok_id, tanggal) values
  ('a0000000-0000-0000-0000-000000000601', 'a0000000-0000-0000-0000-000000000000', '2026-10-13'),
  ('a0000000-0000-0000-0000-000000000602', 'a0000000-0000-0000-0000-000000000000', '2026-10-13');
insert into public.kegiatan_kelas (kelompok_id, kegiatan_id, kelas_id) values
  ('a0000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000601', 'a0000000-0000-0000-0000-0000000000c1'),
  ('a0000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000601', 'a0000000-0000-0000-0000-0000000000c2'),
  ('a0000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000602', 'a0000000-0000-0000-0000-0000000000c2');
insert into public.kegiatan_pengajar (kelompok_id, kegiatan_id, guru_id) values
  ('a0000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000601', 'a0000000-0000-0000-0000-0000000000d1');

-- ── Guru Satu (mengajar K1) ─────────────────────────────────────────
set local role authenticated;
set local request.jwt.claims to '{"sub":"a0000000-0000-0000-0000-0000000000a2","role":"authenticated"}';

select lives_ok(
  $$ select public.simpan_materi_kegiatan('a0000000-0000-0000-0000-000000000601', jsonb_build_array(
       jsonb_build_object('kitab_id', (select id from public.kitab where jenis = 'quran'), 'jenis', 'makna',
                          'mulai_surat', 2, 'mulai_ayat', 280, 'selesai_surat', 3, 'selesai_ayat', 10),
       jsonb_build_object('kitab_id', 'a0000000-0000-0000-0000-0000000000f1', 'jenis', 'makna', 'mulai', 26, 'selesai', 38)
     )) $$,
  'guru: simpan materi kegiatan gabungan (lintas surat + halaman)'
);
select results_eq(
  $$ select mulai, selesai from public.kegiatan_materi
     where kegiatan_id = 'a0000000-0000-0000-0000-000000000601' order by urutan $$,
  $$ values (287, 303), (26, 38) $$,
  'surat:ayat dikonversi ke ayat global, urutan dipertahankan'
);
select results_eq(
  $$ select teks, mulai_surat, mulai_ayat, selesai_surat, selesai_ayat from public.v_kegiatan_materi
     where kegiatan_id = 'a0000000-0000-0000-0000-000000000601' order by urutan $$,
  $$ values ('Al-Baqarah 280 – Ali ''Imran 10', 2, 280, 3, 10), ('hal. 26–38', null::int, null::int, null::int, null::int) $$,
  'v_kegiatan_materi: teks rentang & surat:ayat untuk diedit'
);
select lives_ok(
  $$ select public.simpan_materi_kegiatan('a0000000-0000-0000-0000-000000000601', jsonb_build_array(
       jsonb_build_object('kitab_id', (select id from public.kitab where jenis = 'quran'), 'jenis', 'bacaan',
                          'mulai_surat', 2, 'mulai_ayat', 253, 'selesai_ayat', 260))) $$,
  'simpan ulang mengganti seluruh baris; surat "sampai" boleh kosong = surat yang sama'
);
select is(
  (select count(*)::int from public.kegiatan_materi where kegiatan_id = 'a0000000-0000-0000-0000-000000000601'),
  1, 'baris lama terganti'
);
select throws_ok(
  $$ select public.simpan_materi_kegiatan('a0000000-0000-0000-0000-000000000601', jsonb_build_array(
       jsonb_build_object('kitab_id', 'a0000000-0000-0000-0000-0000000000f1', 'mulai', 40, 'selesai', 30))) $$,
  '22023', 'Baris 1: "sampai" harus sesudah "dari"', 'rentang terbalik ditolak dengan pesan jelas'
);
select throws_ok(
  $$ select public.simpan_materi_kegiatan('a0000000-0000-0000-0000-000000000601', jsonb_build_array(
       jsonb_build_object('kitab_id', (select id from public.kitab where jenis = 'quran'), 'mulai_surat', 1, 'mulai_ayat', 1, 'selesai_ayat', 9))) $$,
  '22023', null, 'ayat melebihi jumlah ayat surat ditolak'
);
select is(
  (select count(*)::int from public.kegiatan_materi where kegiatan_id = 'a0000000-0000-0000-0000-000000000601'),
  1, 'galat membatalkan seluruh perubahan (atomik)'
);
select throws_ok(
  $$ select public.simpan_materi_kegiatan('a0000000-0000-0000-0000-000000000602', '[]'::jsonb) $$,
  '42501', null, 'guru: tidak bisa mengubah materi kegiatan kelas lain'
);

select lives_ok(
  $$ select public.simpan_rundown('a0000000-0000-0000-0000-000000000601', jsonb_build_array(
       jsonb_build_object('waktu', '19:30', 'aktivitas', 'Pembukaan'),
       jsonb_build_object('waktu', '', 'aktivitas', '   '),
       jsonb_build_object('waktu', '19:45', 'aktivitas', 'Makna Al-Qur''an'))) $$,
  'guru: simpan rundown'
);
select results_eq(
  $$ select aktivitas from public.kegiatan_rundown where kegiatan_id = 'a0000000-0000-0000-0000-000000000601' order by urutan $$,
  $$ values ('Pembukaan'), ('Makna Al-Qur''an') $$,
  'baris rundown kosong diabaikan'
);

select results_eq(
  $$ select jsonb_array_length(kelas), pengajar, jumlah_materi from public.v_kegiatan_ringkas
     where id = 'a0000000-0000-0000-0000-000000000601' $$,
  $$ values (2, array['Guru Satu'], 1) $$,
  'v_kegiatan_ringkas: kelas gabungan, pengajar, jumlah materi'
);
select is(
  (select count(*)::int from public.v_kegiatan_ringkas),
  1, 'v_kegiatan_ringkas mengikuti RLS (guru tidak melihat kegiatan kelas lain)'
);

-- ── Wali tidak bisa memanggil fungsi simpan ─────────────────────────
set local request.jwt.claims to '{"sub":"a0000000-0000-0000-0000-0000000000a4","role":"authenticated"}';
select throws_ok(
  $$ select public.simpan_rundown('a0000000-0000-0000-0000-000000000601', '[]'::jsonb) $$,
  '42501', null, 'wali: tidak bisa mengubah rundown'
);

select * from finish();
rollback;
