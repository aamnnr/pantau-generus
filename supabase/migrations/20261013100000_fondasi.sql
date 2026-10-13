-- Fondasi: kelompok, profil & peran, pengaturan, serta fungsi pembantu RLS (ARCHITECTURE §4.1, §6).

create type public.peran as enum ('admin', 'guru', 'pengurus', 'wali');

-- Tanggal "hari ini" selalu menurut WIB, bukan UTC server.
create function public.hari_ini() returns date
language sql stable
set search_path = ''
as $$ select (now() at time zone 'Asia/Jakarta')::date $$;

create function public.set_updated_at() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end $$;

create table public.kelompok (
  id uuid primary key default gen_random_uuid(),
  nama text not null check (length(trim(nama)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profil (
  id uuid primary key references auth.users (id) on delete cascade,
  kelompok_id uuid not null references public.kelompok (id),
  nama text not null check (length(trim(nama)) > 0),
  no_hp text not null unique check (no_hp ~ '^628[0-9]{8,11}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profil_peran (
  id uuid primary key default gen_random_uuid(),
  kelompok_id uuid not null references public.kelompok (id),
  profil_id uuid not null references public.profil (id) on delete cascade,
  peran public.peran not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profil_id, peran)
);

create table public.pengaturan (
  id uuid primary key default gen_random_uuid(),
  kelompok_id uuid not null unique references public.kelompok (id) on delete cascade,
  ambang_kehadiran smallint not null default 60 check (ambang_kehadiran between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at before update on public.kelompok for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.profil for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.profil_peran for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.pengaturan for each row execute function public.set_updated_at();

-- ── Fungsi pembantu RLS ─────────────────────────────────────────────
-- security definer agar tidak memicu RLS rekursif saat dibaca dari kebijakan.

create function public.kelompok_saya() returns uuid
language sql stable security definer
set search_path = ''
as $$ select kelompok_id from public.profil where id = auth.uid() $$;

create function public.punya_peran(p public.peran) returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profil_peran
    where profil_id = auth.uid() and peran = p
  )
$$;

-- Kolom kelompok_id tabel lain default ke kelompok pengguna yang menulis.
-- Ditambahkan setelah fungsi ada.
alter table public.profil_peran alter column kelompok_id set default public.kelompok_saya();

-- ── RLS ─────────────────────────────────────────────────────────────

alter table public.kelompok enable row level security;
alter table public.profil enable row level security;
alter table public.profil_peran enable row level security;
alter table public.pengaturan enable row level security;

create policy kelompok_select on public.kelompok for select to authenticated
  using (id = (select public.kelompok_saya()));
create policy kelompok_update on public.kelompok for update to authenticated
  using (id = (select public.kelompok_saya()) and (select public.punya_peran('admin')));

-- Profil & peran ditulis lewat service_role (manajemen akun), jadi tanpa kebijakan tulis.
-- Pengurus ikut melihat karena PRD §4 memberi pengurus akses lihat data wali & akun.
create policy profil_select on public.profil for select to authenticated
  using (
    id = (select auth.uid())
    or (
      kelompok_id = (select public.kelompok_saya())
      and ((select public.punya_peran('admin')) or (select public.punya_peran('pengurus')))
    )
  );

create policy profil_peran_select on public.profil_peran for select to authenticated
  using (
    profil_id = (select auth.uid())
    or (
      kelompok_id = (select public.kelompok_saya())
      and ((select public.punya_peran('admin')) or (select public.punya_peran('pengurus')))
    )
  );

create policy pengaturan_select on public.pengaturan for select to authenticated
  using (kelompok_id = (select public.kelompok_saya()));
create policy pengaturan_update on public.pengaturan for update to authenticated
  using (
    kelompok_id = (select public.kelompok_saya())
    and ((select public.punya_peran('admin')) or (select public.punya_peran('pengurus')))
  );
