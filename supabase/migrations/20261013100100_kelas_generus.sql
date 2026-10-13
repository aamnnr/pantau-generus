-- Struktur kelas, generus, wali, dan guru (ARCHITECTURE §4.2).

create type public.jenjang as enum ('caberawit', 'pra_remaja', 'remaja');
create type public.jenis_kelamin as enum ('laki_laki', 'perempuan');
create type public.status_generus as enum ('aktif', 'lulus', 'pindah', 'nonaktif');

create table public.kelas (
  id uuid primary key default gen_random_uuid(),
  kelompok_id uuid not null default public.kelompok_saya() references public.kelompok (id),
  jenjang public.jenjang not null,
  nama text not null check (length(trim(nama)) > 0),
  urutan smallint not null default 0,
  aktif boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (kelompok_id, nama)
);

create table public.generus (
  id uuid primary key default gen_random_uuid(),
  kelompok_id uuid not null default public.kelompok_saya() references public.kelompok (id),
  nama text not null check (length(trim(nama)) > 0),
  jenis_kelamin public.jenis_kelamin not null,
  tanggal_lahir date,
  kelas_id uuid not null references public.kelas (id),
  status public.status_generus not null default 'aktif',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.generus (kelas_id) where status = 'aktif';

create table public.riwayat_kelas (
  id uuid primary key default gen_random_uuid(),
  kelompok_id uuid not null references public.kelompok (id),
  generus_id uuid not null references public.generus (id) on delete cascade,
  kelas_id uuid not null references public.kelas (id),
  mulai date not null,
  selesai date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (selesai is null or selesai >= mulai)
);
create index on public.riwayat_kelas (generus_id);

create table public.generus_wali (
  id uuid primary key default gen_random_uuid(),
  kelompok_id uuid not null default public.kelompok_saya() references public.kelompok (id),
  generus_id uuid not null references public.generus (id) on delete cascade,
  profil_id uuid not null references public.profil (id) on delete cascade,
  hubungan text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (generus_id, profil_id)
);
create index on public.generus_wali (profil_id);

create table public.guru (
  id uuid primary key default gen_random_uuid(),
  kelompok_id uuid not null default public.kelompok_saya() references public.kelompok (id),
  nama text not null check (length(trim(nama)) > 0),
  no_hp text check (no_hp ~ '^628[0-9]{8,11}$'),
  profil_id uuid unique references public.profil (id) on delete set null,
  aktif boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.guru_kelas (
  id uuid primary key default gen_random_uuid(),
  kelompok_id uuid not null default public.kelompok_saya() references public.kelompok (id),
  guru_id uuid not null references public.guru (id) on delete cascade,
  kelas_id uuid not null references public.kelas (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (guru_id, kelas_id)
);
create index on public.guru_kelas (kelas_id);

create trigger set_updated_at before update on public.kelas for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.generus for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.riwayat_kelas for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.generus_wali for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.guru for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.guru_kelas for each row execute function public.set_updated_at();

-- Riwayat kelas dicatat otomatis agar naik kelas massal tidak perlu menulis dua tabel.
-- security definer: riwayat_kelas tidak punya kebijakan tulis untuk pengguna.
create function public.catat_riwayat_kelas() returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    if new.kelas_id is not distinct from old.kelas_id then
      return new;
    end if;
    update public.riwayat_kelas
      set selesai = public.hari_ini()
      where generus_id = new.id and selesai is null;
  end if;

  insert into public.riwayat_kelas (kelompok_id, generus_id, kelas_id, mulai)
  values (new.kelompok_id, new.id, new.kelas_id, public.hari_ini());
  return new;
end $$;

create trigger catat_riwayat_kelas
  after insert or update of kelas_id on public.generus
  for each row execute function public.catat_riwayat_kelas();

-- ── Fungsi pembantu RLS ─────────────────────────────────────────────

create function public.guru_mengajar_kelas(p_kelas_id uuid) returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.guru_kelas gk
    join public.guru g on g.id = gk.guru_id
    where gk.kelas_id = p_kelas_id and g.profil_id = auth.uid() and g.aktif
  )
$$;

create function public.wali_dari(p_generus_id uuid) returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.generus_wali
    where generus_id = p_generus_id and profil_id = auth.uid()
  )
$$;

-- Dipakai tabel turunan generus (penilaian, susulan, dll.) agar aturan "guru kelasnya" seragam.
create function public.guru_mengajar_generus(p_generus_id uuid) returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.generus g
    where g.id = p_generus_id and public.guru_mengajar_kelas(g.kelas_id)
  )
$$;

create function public.boleh_lihat_generus(p_generus_id uuid) returns boolean
language sql stable security definer
set search_path = ''
as $$
  select public.punya_peran('admin')
      or public.punya_peran('pengurus')
      or public.guru_mengajar_generus(p_generus_id)
      or public.wali_dari(p_generus_id)
$$;

-- ── RLS ─────────────────────────────────────────────────────────────

alter table public.kelas enable row level security;
alter table public.generus enable row level security;
alter table public.riwayat_kelas enable row level security;
alter table public.generus_wali enable row level security;
alter table public.guru enable row level security;
alter table public.guru_kelas enable row level security;

-- Master data: semua pengguna masuk boleh lihat, hanya admin menulis.
create policy kelas_select on public.kelas for select to authenticated
  using (kelompok_id = (select public.kelompok_saya()));
create policy kelas_tulis on public.kelas for all to authenticated
  using (kelompok_id = (select public.kelompok_saya()) and (select public.punya_peran('admin')))
  with check (kelompok_id = (select public.kelompok_saya()) and (select public.punya_peran('admin')));

create policy guru_select on public.guru for select to authenticated
  using (kelompok_id = (select public.kelompok_saya()));
create policy guru_tulis on public.guru for all to authenticated
  using (kelompok_id = (select public.kelompok_saya()) and (select public.punya_peran('admin')))
  with check (kelompok_id = (select public.kelompok_saya()) and (select public.punya_peran('admin')));

create policy guru_kelas_select on public.guru_kelas for select to authenticated
  using (kelompok_id = (select public.kelompok_saya()));
create policy guru_kelas_tulis on public.guru_kelas for all to authenticated
  using (kelompok_id = (select public.kelompok_saya()) and (select public.punya_peran('admin')))
  with check (kelompok_id = (select public.kelompok_saya()) and (select public.punya_peran('admin')));

create policy generus_select on public.generus for select to authenticated
  using (kelompok_id = (select public.kelompok_saya()) and public.boleh_lihat_generus(id));
create policy generus_tulis on public.generus for all to authenticated
  using (kelompok_id = (select public.kelompok_saya()) and (select public.punya_peran('admin')))
  with check (kelompok_id = (select public.kelompok_saya()) and (select public.punya_peran('admin')));

create policy riwayat_kelas_select on public.riwayat_kelas for select to authenticated
  using (kelompok_id = (select public.kelompok_saya()) and public.boleh_lihat_generus(generus_id));

create policy generus_wali_select on public.generus_wali for select to authenticated
  using (
    kelompok_id = (select public.kelompok_saya())
    and (profil_id = (select auth.uid()) or public.boleh_lihat_generus(generus_id))
  );
create policy generus_wali_tulis on public.generus_wali for all to authenticated
  using (kelompok_id = (select public.kelompok_saya()) and (select public.punya_peran('admin')))
  with check (kelompok_id = (select public.kelompok_saya()) and (select public.punya_peran('admin')));
