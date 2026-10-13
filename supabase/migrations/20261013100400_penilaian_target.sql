-- Penilaian hafalan/praktik, tilawati, target bulanan, catatan raport (ARCHITECTURE §4.5).

create type public.status_penilaian as enum ('belum', 'proses', 'lancar');
create type public.jenis_capaian_tilawati as enum ('tambah', 'koreksi', 'naik_jilid');

-- Append-only: status terakhir (tanggal, created_at) yang berlaku.
create table public.penilaian (
  id uuid primary key default gen_random_uuid(),
  kelompok_id uuid not null default public.kelompok_saya() references public.kelompok (id),
  generus_id uuid not null references public.generus (id) on delete cascade,
  materi_item_id uuid not null references public.materi_item (id),
  status public.status_penilaian not null,
  tanggal date not null default public.hari_ini(),
  dinilai_oleh uuid default auth.uid() references public.profil (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.penilaian (generus_id, materi_item_id, tanggal desc, created_at desc);

create table public.jilid_tilawati (
  id uuid primary key default gen_random_uuid(),
  kelompok_id uuid not null default public.kelompok_saya() references public.kelompok (id),
  jilid smallint not null check (jilid > 0),
  total_halaman smallint not null check (total_halaman > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (kelompok_id, jilid)
);

-- Append-only; entri terakhir = posisi saat ini. jilid/halaman = posisi SETELAH entri.
create table public.capaian_tilawati (
  id uuid primary key default gen_random_uuid(),
  kelompok_id uuid not null default public.kelompok_saya() references public.kelompok (id),
  generus_id uuid not null references public.generus (id) on delete cascade,
  jenis public.jenis_capaian_tilawati not null,
  tambahan smallint,
  jilid smallint not null check (jilid > 0),
  halaman smallint not null check (halaman >= 0),
  kegiatan_id uuid references public.kegiatan (id) on delete set null,
  tanggal date not null default public.hari_ini(),
  dinilai_oleh uuid default auth.uid() references public.profil (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((jenis = 'tambah') = (tambahan is not null)),
  check (tambahan is null or tambahan > 0)
);
create index on public.capaian_tilawati (generus_id, tanggal desc, created_at desc);

create table public.target_bulanan (
  id uuid primary key default gen_random_uuid(),
  kelompok_id uuid not null default public.kelompok_saya() references public.kelompok (id),
  kelas_id uuid not null references public.kelas (id) on delete cascade,
  bulan date not null check (extract(day from bulan) = 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (kelas_id, bulan)
);

create table public.target_makna (
  id uuid primary key default gen_random_uuid(),
  kelompok_id uuid not null default public.kelompok_saya() references public.kelompok (id),
  target_bulanan_id uuid not null references public.target_bulanan (id) on delete cascade,
  kitab_id uuid not null references public.kitab (id),
  mulai integer not null,
  selesai integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (mulai <= selesai)
);

create table public.target_materi (
  id uuid primary key default gen_random_uuid(),
  kelompok_id uuid not null default public.kelompok_saya() references public.kelompok (id),
  target_bulanan_id uuid not null references public.target_bulanan (id) on delete cascade,
  materi_item_id uuid not null references public.materi_item (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (target_bulanan_id, materi_item_id)
);

create table public.target_tilawati (
  id uuid primary key default gen_random_uuid(),
  kelompok_id uuid not null default public.kelompok_saya() references public.kelompok (id),
  target_bulanan_id uuid not null unique references public.target_bulanan (id) on delete cascade,
  jilid smallint not null check (jilid > 0),
  halaman smallint not null check (halaman >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.catatan_raport (
  id uuid primary key default gen_random_uuid(),
  kelompok_id uuid not null default public.kelompok_saya() references public.kelompok (id),
  generus_id uuid not null references public.generus (id) on delete cascade,
  bulan date not null check (extract(day from bulan) = 1),
  catatan text not null,
  ditulis_oleh uuid default auth.uid() references public.profil (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (generus_id, bulan)
);

create trigger set_updated_at before update on public.penilaian for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.jilid_tilawati for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.capaian_tilawati for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.target_bulanan for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.target_makna for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.target_materi for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.target_tilawati for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.catatan_raport for each row execute function public.set_updated_at();

create trigger cek_rentang_kitab before insert or update on public.target_makna
  for each row execute function public.cek_rentang_kitab();

-- ── RLS ─────────────────────────────────────────────────────────────

alter table public.penilaian enable row level security;
alter table public.jilid_tilawati enable row level security;
alter table public.capaian_tilawati enable row level security;
alter table public.target_bulanan enable row level security;
alter table public.target_makna enable row level security;
alter table public.target_materi enable row level security;
alter table public.target_tilawati enable row level security;
alter table public.catatan_raport enable row level security;

-- Penilaian & tilawati append-only: guru hanya menambah; koreksi = entri baru. Admin boleh menghapus salah input.
create policy penilaian_select on public.penilaian for select to authenticated
  using (kelompok_id = (select public.kelompok_saya()) and public.boleh_lihat_generus(generus_id));
create policy penilaian_insert on public.penilaian for insert to authenticated
  with check (
    kelompok_id = (select public.kelompok_saya())
    and ((select public.punya_peran('admin')) or public.guru_mengajar_generus(generus_id))
  );
create policy penilaian_delete on public.penilaian for delete to authenticated
  using (kelompok_id = (select public.kelompok_saya()) and (select public.punya_peran('admin')));

create policy capaian_tilawati_select on public.capaian_tilawati for select to authenticated
  using (kelompok_id = (select public.kelompok_saya()) and public.boleh_lihat_generus(generus_id));
create policy capaian_tilawati_insert on public.capaian_tilawati for insert to authenticated
  with check (
    kelompok_id = (select public.kelompok_saya())
    and ((select public.punya_peran('admin')) or public.guru_mengajar_generus(generus_id))
  );
create policy capaian_tilawati_delete on public.capaian_tilawati for delete to authenticated
  using (kelompok_id = (select public.kelompok_saya()) and (select public.punya_peran('admin')));

-- Jilid & target = master data.
create policy jilid_tilawati_select on public.jilid_tilawati for select to authenticated
  using (kelompok_id = (select public.kelompok_saya()));
create policy jilid_tilawati_tulis on public.jilid_tilawati for all to authenticated
  using (kelompok_id = (select public.kelompok_saya()) and (select public.punya_peran('admin')))
  with check (kelompok_id = (select public.kelompok_saya()) and (select public.punya_peran('admin')));

create policy target_bulanan_select on public.target_bulanan for select to authenticated
  using (kelompok_id = (select public.kelompok_saya()));
create policy target_bulanan_tulis on public.target_bulanan for all to authenticated
  using (kelompok_id = (select public.kelompok_saya()) and (select public.punya_peran('admin')))
  with check (kelompok_id = (select public.kelompok_saya()) and (select public.punya_peran('admin')));

create policy target_makna_select on public.target_makna for select to authenticated
  using (kelompok_id = (select public.kelompok_saya()));
create policy target_makna_tulis on public.target_makna for all to authenticated
  using (kelompok_id = (select public.kelompok_saya()) and (select public.punya_peran('admin')))
  with check (kelompok_id = (select public.kelompok_saya()) and (select public.punya_peran('admin')));

create policy target_materi_select on public.target_materi for select to authenticated
  using (kelompok_id = (select public.kelompok_saya()));
create policy target_materi_tulis on public.target_materi for all to authenticated
  using (kelompok_id = (select public.kelompok_saya()) and (select public.punya_peran('admin')))
  with check (kelompok_id = (select public.kelompok_saya()) and (select public.punya_peran('admin')));

create policy target_tilawati_select on public.target_tilawati for select to authenticated
  using (kelompok_id = (select public.kelompok_saya()));
create policy target_tilawati_tulis on public.target_tilawati for all to authenticated
  using (kelompok_id = (select public.kelompok_saya()) and (select public.punya_peran('admin')))
  with check (kelompok_id = (select public.kelompok_saya()) and (select public.punya_peran('admin')));

create policy catatan_raport_select on public.catatan_raport for select to authenticated
  using (kelompok_id = (select public.kelompok_saya()) and public.boleh_lihat_generus(generus_id));
create policy catatan_raport_tulis on public.catatan_raport for all to authenticated
  using (
    kelompok_id = (select public.kelompok_saya())
    and (
      (select public.punya_peran('admin'))
      or (select public.punya_peran('pengurus'))
      or public.guru_mengajar_generus(generus_id)
    )
  )
  with check (
    kelompok_id = (select public.kelompok_saya())
    and (
      (select public.punya_peran('admin'))
      or (select public.punya_peran('pengurus'))
      or public.guru_mengajar_generus(generus_id)
    )
  );
