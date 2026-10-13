-- Struktur dasar: RLS di semua tabel, data surat, konversi ayat, trigger otomatis.
begin;
\ir _setup.psql
select plan(19);

-- Setiap tabel public wajib RLS (CLAUDE.md, Aturan Database).
select is_empty(
  $$ select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity $$,
  'semua tabel public memakai RLS'
);

-- Setiap tabel (kecuali kelompok & data referensi) punya kelompok_id, created_at, updated_at.
select is_empty(
  $$ select t.table_name from information_schema.tables t
     where t.table_schema = 'public' and t.table_type = 'BASE TABLE'
       and t.table_name not in ('kelompok', 'quran_surat')
       and not exists (select 1 from information_schema.columns c
                       where c.table_schema = 'public' and c.table_name = t.table_name
                         and c.column_name = 'kelompok_id') $$,
  'semua tabel domain punya kelompok_id'
);
select is_empty(
  $$ select t.table_name from information_schema.tables t
     where t.table_schema = 'public' and t.table_type = 'BASE TABLE'
       and t.table_name <> 'quran_surat'
       and (select count(*) from information_schema.columns c
            where c.table_schema = 'public' and c.table_name = t.table_name
              and c.column_name in ('created_at', 'updated_at')) < 2 $$,
  'semua tabel punya created_at & updated_at'
);

-- Data surat
select is((select count(*)::int from public.quran_surat), 114, '114 surat');
select is((select sum(jumlah_ayat)::int from public.quran_surat), 6236, 'total 6236 ayat');
select is((select ayat_awal::int from public.quran_surat where nomor = 114), 6231, 'An-Nas mulai ayat global 6231');

-- Konversi ayat global
select is(public.fn_ayat_global(1, 1), 1, 'Al-Fatihah 1 = global 1');
select is(public.fn_ayat_global(2, 1), 8, 'Al-Baqarah 1 = global 8');
select is(public.fn_ayat_global(114, 6), 6236, 'An-Nas 6 = global 6236');
select throws_ok($$ select public.fn_ayat_global(1, 8) $$, '22023', null, 'ayat melebihi jumlah ayat surat ditolak');
select is((select (surat, ayat)::text from public.fn_surat_ayat(294)), '(3,1)', 'global 294 = Ali Imran 1');

-- Format rentang
select is(
  public.fn_format_rentang((select id from public.kitab where kelompok_id = 'a0000000-0000-0000-0000-000000000000' and jenis = 'quran'), 8, 27),
  'Al-Baqarah 1–20', 'rentang dalam satu surat'
);
select is(
  public.fn_format_rentang((select id from public.kitab where kelompok_id = 'a0000000-0000-0000-0000-000000000000' and jenis = 'quran'), 287, 303),
  'Al-Baqarah 280 – Ali ''Imran 10', 'rentang lintas surat'
);
select is(public.fn_format_rentang('a0000000-0000-0000-0000-0000000000f1', 15, 20), 'hal. 15–20', 'rentang halaman');

-- Kelompok baru otomatis punya pengaturan (ambang 60%) dan kitab Al-Qur'an
select is(
  (select ambang_kehadiran::int from public.pengaturan where kelompok_id = 'a0000000-0000-0000-0000-000000000000'),
  60, 'pengaturan default ambang kehadiran 60'
);
select is(
  (select count(*)::int from public.kitab where kelompok_id = 'a0000000-0000-0000-0000-000000000000' and jenis = 'quran'),
  1, 'kitab Al-Qur''an dibuat otomatis'
);

-- Validasi rentang terhadap total halaman kitab
select throws_ok(
  $$ insert into public.susulan (kelompok_id, generus_id, kitab_id, mulai, selesai)
     values ('a0000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-0000000000e1', 'a0000000-0000-0000-0000-0000000000f1', 95, 101) $$,
  '23514', null, 'rentang melebihi total halaman ditolak'
);

-- Riwayat kelas tercatat saat generus pindah kelas
update public.generus set kelas_id = 'a0000000-0000-0000-0000-0000000000c2' where id = 'a0000000-0000-0000-0000-0000000000e1';
select is(
  (select count(*)::int from public.riwayat_kelas where generus_id = 'a0000000-0000-0000-0000-0000000000e1'),
  2, 'pindah kelas menambah riwayat'
);
select is(
  (select count(*)::int from public.riwayat_kelas where generus_id = 'a0000000-0000-0000-0000-0000000000e1' and selesai is null),
  1, 'hanya satu riwayat kelas yang masih terbuka'
);

select * from finish();
rollback;
