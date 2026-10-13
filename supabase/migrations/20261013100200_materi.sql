-- Kitab, data surat Al-Qur'an, materi item, dan konversi ayat global (ARCHITECTURE §4.3, §4.6).

create type public.jenis_kitab as enum ('quran', 'hadist');
create type public.satuan as enum ('halaman', 'ayat');
create type public.jenis_materi as enum ('hafalan', 'praktik');

create table public.kitab (
  id uuid primary key default gen_random_uuid(),
  kelompok_id uuid not null default public.kelompok_saya() references public.kelompok (id),
  nama text not null check (length(trim(nama)) > 0),
  jenis public.jenis_kitab not null,
  satuan public.satuan not null,
  total_satuan integer not null check (total_satuan > 0),
  urutan smallint not null default 0,
  aktif boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (kelompok_id, nama),
  -- Al-Qur'an selalu per ayat global (6236), Al-Hadist selalu per halaman.
  check (
    (jenis = 'quran' and satuan = 'ayat' and total_satuan = 6236)
    or (jenis = 'hadist' and satuan = 'halaman')
  )
);
create unique index kitab_satu_quran on public.kitab (kelompok_id) where jenis = 'quran';

-- Data referensi global (tanpa kelompok_id), read-only bagi pengguna.
create table public.quran_surat (
  nomor smallint primary key check (nomor between 1 and 114),
  nama_latin text not null,
  nama_arab text not null,
  jumlah_ayat smallint not null check (jumlah_ayat > 0),
  ayat_awal smallint not null unique
);

create table public.materi_item (
  id uuid primary key default gen_random_uuid(),
  kelompok_id uuid not null default public.kelompok_saya() references public.kelompok (id),
  jenis public.jenis_materi not null,
  nama text not null check (length(trim(nama)) > 0),
  jenjang public.jenjang,
  urutan smallint not null default 0,
  aktif boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (kelompok_id, jenis, nama)
);

create trigger set_updated_at before update on public.kitab for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.materi_item for each row execute function public.set_updated_at();

-- ── Data 114 surat (standar Kemenag, total 6.236 ayat) ─────────────
-- ayat_awal dihitung dari jumlah kumulatif agar tidak ada salah ketik.
insert into public.quran_surat (nomor, nama_latin, nama_arab, jumlah_ayat, ayat_awal)
select nomor, nama_latin, nama_arab, jumlah_ayat,
       (coalesce(sum(jumlah_ayat) over (order by nomor rows between unbounded preceding and 1 preceding), 0) + 1)::smallint
from (values
  (1, 'Al-Fatihah', 'الفاتحة', 7),
  (2, 'Al-Baqarah', 'البقرة', 286),
  (3, 'Ali ''Imran', 'آل عمران', 200),
  (4, 'An-Nisa''', 'النساء', 176),
  (5, 'Al-Ma''idah', 'المائدة', 120),
  (6, 'Al-An''am', 'الأنعام', 165),
  (7, 'Al-A''raf', 'الأعراف', 206),
  (8, 'Al-Anfal', 'الأنفال', 75),
  (9, 'At-Taubah', 'التوبة', 129),
  (10, 'Yunus', 'يونس', 109),
  (11, 'Hud', 'هود', 123),
  (12, 'Yusuf', 'يوسف', 111),
  (13, 'Ar-Ra''d', 'الرعد', 43),
  (14, 'Ibrahim', 'إبراهيم', 52),
  (15, 'Al-Hijr', 'الحجر', 99),
  (16, 'An-Nahl', 'النحل', 128),
  (17, 'Al-Isra''', 'الإسراء', 111),
  (18, 'Al-Kahf', 'الكهف', 110),
  (19, 'Maryam', 'مريم', 98),
  (20, 'Taha', 'طه', 135),
  (21, 'Al-Anbiya''', 'الأنبياء', 112),
  (22, 'Al-Hajj', 'الحج', 78),
  (23, 'Al-Mu''minun', 'المؤمنون', 118),
  (24, 'An-Nur', 'النور', 64),
  (25, 'Al-Furqan', 'الفرقان', 77),
  (26, 'Asy-Syu''ara''', 'الشعراء', 227),
  (27, 'An-Naml', 'النمل', 93),
  (28, 'Al-Qasas', 'القصص', 88),
  (29, 'Al-''Ankabut', 'العنكبوت', 69),
  (30, 'Ar-Rum', 'الروم', 60),
  (31, 'Luqman', 'لقمان', 34),
  (32, 'As-Sajdah', 'السجدة', 30),
  (33, 'Al-Ahzab', 'الأحزاب', 73),
  (34, 'Saba''', 'سبأ', 54),
  (35, 'Fatir', 'فاطر', 45),
  (36, 'Yasin', 'يس', 83),
  (37, 'As-Saffat', 'الصافات', 182),
  (38, 'Sad', 'ص', 88),
  (39, 'Az-Zumar', 'الزمر', 75),
  (40, 'Gafir', 'غافر', 85),
  (41, 'Fussilat', 'فصلت', 54),
  (42, 'Asy-Syura', 'الشورى', 53),
  (43, 'Az-Zukhruf', 'الزخرف', 89),
  (44, 'Ad-Dukhan', 'الدخان', 59),
  (45, 'Al-Jasiyah', 'الجاثية', 37),
  (46, 'Al-Ahqaf', 'الأحقاف', 35),
  (47, 'Muhammad', 'محمد', 38),
  (48, 'Al-Fath', 'الفتح', 29),
  (49, 'Al-Hujurat', 'الحجرات', 18),
  (50, 'Qaf', 'ق', 45),
  (51, 'Az-Zariyat', 'الذاريات', 60),
  (52, 'At-Tur', 'الطور', 49),
  (53, 'An-Najm', 'النجم', 62),
  (54, 'Al-Qamar', 'القمر', 55),
  (55, 'Ar-Rahman', 'الرحمن', 78),
  (56, 'Al-Waqi''ah', 'الواقعة', 96),
  (57, 'Al-Hadid', 'الحديد', 29),
  (58, 'Al-Mujadalah', 'المجادلة', 22),
  (59, 'Al-Hasyr', 'الحشر', 24),
  (60, 'Al-Mumtahanah', 'الممتحنة', 13),
  (61, 'As-Saff', 'الصف', 14),
  (62, 'Al-Jumu''ah', 'الجمعة', 11),
  (63, 'Al-Munafiqun', 'المنافقون', 11),
  (64, 'At-Tagabun', 'التغابن', 18),
  (65, 'At-Talaq', 'الطلاق', 12),
  (66, 'At-Tahrim', 'التحريم', 12),
  (67, 'Al-Mulk', 'الملك', 30),
  (68, 'Al-Qalam', 'القلم', 52),
  (69, 'Al-Haqqah', 'الحاقة', 52),
  (70, 'Al-Ma''arij', 'المعارج', 44),
  (71, 'Nuh', 'نوح', 28),
  (72, 'Al-Jinn', 'الجن', 28),
  (73, 'Al-Muzzammil', 'المزمل', 20),
  (74, 'Al-Muddassir', 'المدثر', 56),
  (75, 'Al-Qiyamah', 'القيامة', 40),
  (76, 'Al-Insan', 'الإنسان', 31),
  (77, 'Al-Mursalat', 'المرسلات', 50),
  (78, 'An-Naba''', 'النبأ', 40),
  (79, 'An-Nazi''at', 'النازعات', 46),
  (80, '''Abasa', 'عبس', 42),
  (81, 'At-Takwir', 'التكوير', 29),
  (82, 'Al-Infitar', 'الانفطار', 19),
  (83, 'Al-Mutaffifin', 'المطففين', 36),
  (84, 'Al-Insyiqaq', 'الانشقاق', 25),
  (85, 'Al-Buruj', 'البروج', 22),
  (86, 'At-Tariq', 'الطارق', 17),
  (87, 'Al-A''la', 'الأعلى', 19),
  (88, 'Al-Gasyiyah', 'الغاشية', 26),
  (89, 'Al-Fajr', 'الفجر', 30),
  (90, 'Al-Balad', 'البلد', 20),
  (91, 'Asy-Syams', 'الشمس', 15),
  (92, 'Al-Lail', 'الليل', 21),
  (93, 'Ad-Duha', 'الضحى', 11),
  (94, 'Asy-Syarh', 'الشرح', 8),
  (95, 'At-Tin', 'التين', 8),
  (96, 'Al-''Alaq', 'العلق', 19),
  (97, 'Al-Qadr', 'القدر', 5),
  (98, 'Al-Bayyinah', 'البينة', 8),
  (99, 'Az-Zalzalah', 'الزلزلة', 8),
  (100, 'Al-''Adiyat', 'العاديات', 11),
  (101, 'Al-Qari''ah', 'القارعة', 11),
  (102, 'At-Takasur', 'التكاثر', 8),
  (103, 'Al-''Asr', 'العصر', 3),
  (104, 'Al-Humazah', 'الهمزة', 9),
  (105, 'Al-Fil', 'الفيل', 5),
  (106, 'Quraisy', 'قريش', 4),
  (107, 'Al-Ma''un', 'الماعون', 7),
  (108, 'Al-Kausar', 'الكوثر', 3),
  (109, 'Al-Kafirun', 'الكافرون', 6),
  (110, 'An-Nasr', 'النصر', 3),
  (111, 'Al-Lahab', 'المسد', 5),
  (112, 'Al-Ikhlas', 'الإخلاص', 4),
  (113, 'Al-Falaq', 'الفلق', 5),
  (114, 'An-Nas', 'الناس', 6)
) as s (nomor, nama_latin, nama_arab, jumlah_ayat);

-- ── Konversi ayat global ↔ surat:ayat ───────────────────────────────

create function public.fn_ayat_global(p_surat integer, p_ayat integer) returns integer
language plpgsql stable
set search_path = ''
as $$
declare
  v_surat public.quran_surat;
begin
  select * into v_surat from public.quran_surat where nomor = p_surat;
  if not found then
    raise exception 'Surat % tidak ada', p_surat using errcode = '22023';
  end if;
  if p_ayat < 1 or p_ayat > v_surat.jumlah_ayat then
    raise exception 'Surat % hanya memiliki % ayat', v_surat.nama_latin, v_surat.jumlah_ayat
      using errcode = '22023';
  end if;
  return v_surat.ayat_awal + p_ayat - 1;
end $$;

create function public.fn_surat_ayat(p_global integer, out surat integer, out ayat integer)
language sql stable
set search_path = ''
as $$
  select nomor::integer, (p_global - ayat_awal + 1)::integer
  from public.quran_surat
  where p_global between ayat_awal and ayat_awal + jumlah_ayat - 1
$$;

-- Contoh: "hal. 15–20", "Al-Baqarah 1–20", "Al-Baqarah 280 – Ali 'Imran 10".
create function public.fn_format_rentang(p_kitab_id uuid, p_mulai integer, p_selesai integer) returns text
language plpgsql stable
set search_path = ''
as $$
declare
  v_satuan public.satuan;
  a record;
  b record;
begin
  select satuan into v_satuan from public.kitab where id = p_kitab_id;
  if v_satuan is null then
    return null;
  end if;

  if v_satuan = 'halaman' then
    return case when p_mulai = p_selesai then 'hal. ' || p_mulai
                else 'hal. ' || p_mulai || '–' || p_selesai end;
  end if;

  select s.nama_latin, x.surat, x.ayat into a
    from public.fn_surat_ayat(p_mulai) x join public.quran_surat s on s.nomor = x.surat;
  select s.nama_latin, x.surat, x.ayat into b
    from public.fn_surat_ayat(p_selesai) x join public.quran_surat s on s.nomor = x.surat;

  if a.surat = b.surat then
    return a.nama_latin || ' ' || case when a.ayat = b.ayat then a.ayat::text
                                       else a.ayat || '–' || b.ayat end;
  end if;
  return a.nama_latin || ' ' || a.ayat || ' – ' || b.nama_latin || ' ' || b.ayat;
end $$;

-- Validasi rentang terhadap total satuan kitab; dipakai semua tabel ber-rentang (materi, susulan, target).
create function public.cek_rentang_kitab() returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_total integer;
begin
  select total_satuan into v_total from public.kitab where id = new.kitab_id;
  if new.mulai < 1 or new.selesai > v_total then
    raise exception 'Rentang %–% di luar batas kitab (1–%)', new.mulai, new.selesai, v_total
      using errcode = '23514';
  end if;
  return new;
end $$;

-- ── Kelompok baru otomatis punya pengaturan & kitab Al-Qur'an ──────

create function public.siapkan_kelompok_baru() returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  insert into public.pengaturan (kelompok_id) values (new.id);
  insert into public.kitab (kelompok_id, nama, jenis, satuan, total_satuan, urutan)
  values (new.id, 'Al-Qur''an', 'quran', 'ayat', 6236, 0);
  return new;
end $$;

create trigger siapkan_kelompok_baru
  after insert on public.kelompok
  for each row execute function public.siapkan_kelompok_baru();

-- ── RLS ─────────────────────────────────────────────────────────────

alter table public.kitab enable row level security;
alter table public.quran_surat enable row level security;
alter table public.materi_item enable row level security;

create policy quran_surat_select on public.quran_surat for select to authenticated using (true);

create policy kitab_select on public.kitab for select to authenticated
  using (kelompok_id = (select public.kelompok_saya()));
create policy kitab_tulis on public.kitab for all to authenticated
  using (kelompok_id = (select public.kelompok_saya()) and (select public.punya_peran('admin')))
  with check (kelompok_id = (select public.kelompok_saya()) and (select public.punya_peran('admin')));

create policy materi_item_select on public.materi_item for select to authenticated
  using (kelompok_id = (select public.kelompok_saya()));
create policy materi_item_tulis on public.materi_item for all to authenticated
  using (kelompok_id = (select public.kelompok_saya()) and (select public.punya_peran('admin')))
  with check (kelompok_id = (select public.kelompok_saya()) and (select public.punya_peran('admin')));
