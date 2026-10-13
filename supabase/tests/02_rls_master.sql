-- RLS master data, generus, profil: tiap peran + isolasi antar-kelompok.
begin;
\ir _setup.psql
select plan(24);

-- ── Admin A ─────────────────────────────────────────────────────────
set local role authenticated;
set local request.jwt.claims to '{"sub":"a0000000-0000-0000-0000-0000000000a1","role":"authenticated"}';

select is((select count(*)::int from public.kelas), 2, 'admin: hanya melihat kelas kelompoknya');
select is((select count(*)::int from public.generus), 2, 'admin: melihat semua generus kelompoknya');
select is((select count(*)::int from public.profil), 5, 'admin: melihat semua profil kelompoknya');
select lives_ok(
  $$ insert into public.kelas (jenjang, nama) values ('caberawit', 'Kelas A') $$,
  'admin: boleh menambah kelas (kelompok_id terisi otomatis)'
);
select is(
  (select kelompok_id::text from public.kelas where nama = 'Kelas A'),
  'a0000000-0000-0000-0000-000000000000', 'admin: kelompok_id default = kelompok sendiri'
);
select throws_ok(
  $$ insert into public.kelas (kelompok_id, jenjang, nama) values ('b0000000-0000-0000-0000-000000000000', 'remaja', 'Susupan') $$,
  '42501', null, 'admin: tidak bisa menulis ke kelompok lain'
);
select lives_ok(
  $$ update public.pengaturan set ambang_kehadiran = 65 $$,
  'admin: boleh mengubah pengaturan'
);

-- ── Guru Satu (mengajar K1) ─────────────────────────────────────────
set local request.jwt.claims to '{"sub":"a0000000-0000-0000-0000-0000000000a2","role":"authenticated"}';

select is((select count(*)::int from public.kelas), 3, 'guru: melihat semua kelas (master data)');
select results_eq(
  $$ select nama from public.generus $$, $$ values ('Anak Satu') $$,
  'guru: hanya melihat generus kelasnya'
);
select is((select count(*)::int from public.profil), 1, 'guru: hanya melihat profilnya sendiri');
select throws_ok(
  $$ insert into public.kelas (jenjang, nama) values ('remaja', 'Kelas Guru') $$,
  '42501', null, 'guru: tidak bisa menambah kelas'
);
select throws_ok(
  $$ insert into public.generus (nama, jenis_kelamin, kelas_id) values ('Baru', 'laki_laki', 'a0000000-0000-0000-0000-0000000000c1') $$,
  '42501', null, 'guru: tidak bisa menambah generus'
);
update public.generus set nama = 'Diubah Guru' where id = 'a0000000-0000-0000-0000-0000000000e1';
select is((select nama from public.generus where id = 'a0000000-0000-0000-0000-0000000000e1'), 'Anak Satu', 'guru: tidak bisa mengubah generus');

-- ── Pengurus ────────────────────────────────────────────────────────
set local request.jwt.claims to '{"sub":"a0000000-0000-0000-0000-0000000000a3","role":"authenticated"}';

select is((select count(*)::int from public.generus), 2, 'pengurus: melihat semua generus');
select is((select count(*)::int from public.profil), 5, 'pengurus: melihat profil (data wali & akun)');
select throws_ok(
  $$ insert into public.materi_item (jenis, nama) values ('hafalan', 'Doa Makan') $$,
  '42501', null, 'pengurus: tidak bisa menambah materi item'
);
select lives_ok(
  $$ update public.pengaturan set ambang_kehadiran = 70 $$,
  'pengurus: boleh mengubah ambang kehadiran'
);

-- ── Wali (anak1) ────────────────────────────────────────────────────
set local request.jwt.claims to '{"sub":"a0000000-0000-0000-0000-0000000000a4","role":"authenticated"}';

select results_eq(
  $$ select nama from public.generus $$, $$ values ('Anak Satu') $$,
  'wali: hanya melihat anaknya'
);
select is((select count(*)::int from public.riwayat_kelas), 1, 'wali: hanya melihat riwayat kelas anaknya');
select is((select count(*)::int from public.generus_wali), 1, 'wali: melihat relasi walinya sendiri');
update public.pengaturan set ambang_kehadiran = 10;
select is((select ambang_kehadiran::int from public.pengaturan), 70, 'wali: tidak bisa mengubah pengaturan');
select is((select count(*)::int from public.quran_surat), 114, 'wali: boleh membaca data surat');

-- ── Admin B (kelompok lain) ─────────────────────────────────────────
set local request.jwt.claims to '{"sub":"b0000000-0000-0000-0000-0000000000b1","role":"authenticated"}';

select results_eq(
  $$ select nama from public.generus $$, $$ values ('Anak B') $$,
  'admin kelompok lain: tidak melihat generus kelompok A'
);

-- ── Tamu (anon) ─────────────────────────────────────────────────────
set local role anon;
set local request.jwt.claims to '{"role":"anon"}';

select is((select count(*)::int from public.kelas), 0, 'anon: tidak melihat data apa pun');

select * from finish();
rollback;
