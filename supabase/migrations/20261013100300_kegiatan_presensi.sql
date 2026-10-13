-- Jadwal rutin, kegiatan (termasuk gabungan), presensi, dan susulan (ARCHITECTURE §4.4).

create type public.jenis_kegiatan as enum ('rutin', 'khusus');
create type public.status_kegiatan as enum ('terjadwal', 'selesai', 'batal');
create type public.status_presensi as enum ('hadir', 'terlambat', 'izin', 'sakit', 'alpa');

create table public.jadwal_rutin (
  id uuid primary key default gen_random_uuid(),
  kelompok_id uuid not null default public.kelompok_saya() references public.kelompok (id),
  hari smallint not null check (hari between 1 and 7), -- 1 = Senin … 7 = Minggu (ISO)
  jam_mulai time not null,
  jam_selesai time,
  guru_id uuid references public.guru (id) on delete set null,
  aktif boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (jam_selesai is null or jam_selesai > jam_mulai)
);

create table public.jadwal_rutin_kelas (
  id uuid primary key default gen_random_uuid(),
  kelompok_id uuid not null default public.kelompok_saya() references public.kelompok (id),
  jadwal_rutin_id uuid not null references public.jadwal_rutin (id) on delete cascade,
  kelas_id uuid not null references public.kelas (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (jadwal_rutin_id, kelas_id)
);

create table public.kegiatan (
  id uuid primary key default gen_random_uuid(),
  kelompok_id uuid not null default public.kelompok_saya() references public.kelompok (id),
  jadwal_rutin_id uuid references public.jadwal_rutin (id) on delete set null,
  tanggal date not null,
  jam_mulai time,
  jam_selesai time,
  judul text,
  jenis public.jenis_kegiatan not null default 'khusus',
  status public.status_kegiatan not null default 'terjadwal',
  catatan text,
  diinput_oleh uuid default auth.uid() references public.profil (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (jadwal_rutin_id, tanggal),
  check (jam_selesai is null or jam_mulai is null or jam_selesai > jam_mulai)
);
create index on public.kegiatan (kelompok_id, tanggal);

create table public.kegiatan_kelas (
  id uuid primary key default gen_random_uuid(),
  kelompok_id uuid not null default public.kelompok_saya() references public.kelompok (id),
  kegiatan_id uuid not null references public.kegiatan (id) on delete cascade,
  kelas_id uuid not null references public.kelas (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (kegiatan_id, kelas_id)
);
create index on public.kegiatan_kelas (kelas_id);

create table public.kegiatan_pengajar (
  id uuid primary key default gen_random_uuid(),
  kelompok_id uuid not null default public.kelompok_saya() references public.kelompok (id),
  kegiatan_id uuid not null references public.kegiatan (id) on delete cascade,
  guru_id uuid not null references public.guru (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (kegiatan_id, guru_id)
);

create table public.kegiatan_rundown (
  id uuid primary key default gen_random_uuid(),
  kelompok_id uuid not null default public.kelompok_saya() references public.kelompok (id),
  kegiatan_id uuid not null references public.kegiatan (id) on delete cascade,
  urutan smallint not null,
  waktu time,
  aktivitas text not null check (length(trim(aktivitas)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.kegiatan_rundown (kegiatan_id);

create table public.kegiatan_materi (
  id uuid primary key default gen_random_uuid(),
  kelompok_id uuid not null default public.kelompok_saya() references public.kelompok (id),
  kegiatan_id uuid not null references public.kegiatan (id) on delete cascade,
  kitab_id uuid not null references public.kitab (id),
  mulai integer not null,
  selesai integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (mulai <= selesai)
);
create index on public.kegiatan_materi (kegiatan_id);

create table public.presensi (
  id uuid primary key default gen_random_uuid(),
  kelompok_id uuid not null default public.kelompok_saya() references public.kelompok (id),
  kegiatan_id uuid not null references public.kegiatan (id) on delete cascade,
  generus_id uuid not null references public.generus (id) on delete cascade,
  status public.status_presensi not null,
  keterangan text,
  diubah_oleh uuid default auth.uid() references public.profil (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (kegiatan_id, generus_id)
);
create index on public.presensi (generus_id);

create table public.susulan (
  id uuid primary key default gen_random_uuid(),
  kelompok_id uuid not null default public.kelompok_saya() references public.kelompok (id),
  generus_id uuid not null references public.generus (id) on delete cascade,
  kitab_id uuid not null references public.kitab (id),
  mulai integer not null,
  selesai integer not null,
  tanggal date not null default public.hari_ini(),
  guru_id uuid references public.guru (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (mulai <= selesai)
);
create index on public.susulan (generus_id);

create trigger set_updated_at before update on public.jadwal_rutin for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.jadwal_rutin_kelas for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.kegiatan for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.kegiatan_kelas for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.kegiatan_pengajar for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.kegiatan_rundown for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.kegiatan_materi for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.presensi for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.susulan for each row execute function public.set_updated_at();

create trigger cek_rentang_kitab before insert or update on public.kegiatan_materi
  for each row execute function public.cek_rentang_kitab();
create trigger cek_rentang_kitab before insert or update on public.susulan
  for each row execute function public.cek_rentang_kitab();

-- Jejak siapa yang terakhir mengubah presensi (PRD F4).
create function public.catat_pengubah_presensi() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.diubah_oleh = coalesce(auth.uid(), new.diubah_oleh);
  return new;
end $$;

create trigger catat_pengubah_presensi before update on public.presensi
  for each row execute function public.catat_pengubah_presensi();

-- ── Fungsi pembantu RLS ─────────────────────────────────────────────

-- Kegiatan gabungan: cukup mengajar salah satu kelasnya.
create function public.guru_mengajar_kegiatan(p_kegiatan_id uuid) returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.kegiatan_kelas kk
    where kk.kegiatan_id = p_kegiatan_id and public.guru_mengajar_kelas(kk.kelas_id)
  )
$$;

create function public.boleh_kelola_kegiatan(p_kegiatan_id uuid) returns boolean
language sql stable security definer
set search_path = ''
as $$
  select public.punya_peran('admin') or public.guru_mengajar_kegiatan(p_kegiatan_id)
$$;

create function public.boleh_lihat_kegiatan(p_kegiatan_id uuid) returns boolean
language sql stable security definer
set search_path = ''
as $$
  select public.punya_peran('admin')
      or public.punya_peran('pengurus')
      or public.guru_mengajar_kegiatan(p_kegiatan_id)
      -- Penginput tetap bisa melihat kegiatan yang baru dibuat sebelum kelasnya ditautkan.
      or exists (select 1 from public.kegiatan where id = p_kegiatan_id and diinput_oleh = auth.uid())
      -- Wali: kegiatan kelas anaknya, atau yang mencatat presensi anaknya (anak pernah pindah kelas).
      or exists (
        select 1
        from public.kegiatan_kelas kk
        join public.generus g on g.kelas_id = kk.kelas_id
        where kk.kegiatan_id = p_kegiatan_id and public.wali_dari(g.id)
      )
      or exists (
        select 1 from public.presensi p
        where p.kegiatan_id = p_kegiatan_id and public.wali_dari(p.generus_id)
      )
$$;

-- ── RLS ─────────────────────────────────────────────────────────────

alter table public.jadwal_rutin enable row level security;
alter table public.jadwal_rutin_kelas enable row level security;
alter table public.kegiatan enable row level security;
alter table public.kegiatan_kelas enable row level security;
alter table public.kegiatan_pengajar enable row level security;
alter table public.kegiatan_rundown enable row level security;
alter table public.kegiatan_materi enable row level security;
alter table public.presensi enable row level security;
alter table public.susulan enable row level security;

-- Jadwal = master data.
create policy jadwal_rutin_select on public.jadwal_rutin for select to authenticated
  using (kelompok_id = (select public.kelompok_saya()));
create policy jadwal_rutin_tulis on public.jadwal_rutin for all to authenticated
  using (kelompok_id = (select public.kelompok_saya()) and (select public.punya_peran('admin')))
  with check (kelompok_id = (select public.kelompok_saya()) and (select public.punya_peran('admin')));

create policy jadwal_rutin_kelas_select on public.jadwal_rutin_kelas for select to authenticated
  using (kelompok_id = (select public.kelompok_saya()));
create policy jadwal_rutin_kelas_tulis on public.jadwal_rutin_kelas for all to authenticated
  using (kelompok_id = (select public.kelompok_saya()) and (select public.punya_peran('admin')))
  with check (kelompok_id = (select public.kelompok_saya()) and (select public.punya_peran('admin')));

-- Kegiatan: guru boleh membuat kegiatan baru; kelasnya divalidasi di kegiatan_kelas.
create policy kegiatan_select on public.kegiatan for select to authenticated
  using (kelompok_id = (select public.kelompok_saya()) and public.boleh_lihat_kegiatan(id));
create policy kegiatan_insert on public.kegiatan for insert to authenticated
  with check (
    kelompok_id = (select public.kelompok_saya())
    and ((select public.punya_peran('admin')) or (select public.punya_peran('guru')))
  );
create policy kegiatan_update on public.kegiatan for update to authenticated
  using (kelompok_id = (select public.kelompok_saya()) and public.boleh_kelola_kegiatan(id));
create policy kegiatan_delete on public.kegiatan for delete to authenticated
  using (kelompok_id = (select public.kelompok_saya()) and public.boleh_kelola_kegiatan(id));

-- Guru hanya boleh menautkan kelas yang ia ajar.
create policy kegiatan_kelas_select on public.kegiatan_kelas for select to authenticated
  using (kelompok_id = (select public.kelompok_saya()) and public.boleh_lihat_kegiatan(kegiatan_id));
create policy kegiatan_kelas_tulis on public.kegiatan_kelas for all to authenticated
  using (
    kelompok_id = (select public.kelompok_saya())
    and ((select public.punya_peran('admin')) or public.guru_mengajar_kelas(kelas_id))
  )
  with check (
    kelompok_id = (select public.kelompok_saya())
    and (
      (select public.punya_peran('admin'))
      or (
        public.guru_mengajar_kelas(kelas_id)
        and exists (select 1 from public.kegiatan k where k.id = kegiatan_id
                    and (k.diinput_oleh = (select auth.uid()) or public.guru_mengajar_kegiatan(k.id)))
      )
    )
  );

create policy kegiatan_pengajar_select on public.kegiatan_pengajar for select to authenticated
  using (kelompok_id = (select public.kelompok_saya()) and public.boleh_lihat_kegiatan(kegiatan_id));
create policy kegiatan_pengajar_tulis on public.kegiatan_pengajar for all to authenticated
  using (kelompok_id = (select public.kelompok_saya()) and public.boleh_kelola_kegiatan(kegiatan_id))
  with check (kelompok_id = (select public.kelompok_saya()) and public.boleh_kelola_kegiatan(kegiatan_id));

create policy kegiatan_rundown_select on public.kegiatan_rundown for select to authenticated
  using (kelompok_id = (select public.kelompok_saya()) and public.boleh_lihat_kegiatan(kegiatan_id));
create policy kegiatan_rundown_tulis on public.kegiatan_rundown for all to authenticated
  using (kelompok_id = (select public.kelompok_saya()) and public.boleh_kelola_kegiatan(kegiatan_id))
  with check (kelompok_id = (select public.kelompok_saya()) and public.boleh_kelola_kegiatan(kegiatan_id));

create policy kegiatan_materi_select on public.kegiatan_materi for select to authenticated
  using (kelompok_id = (select public.kelompok_saya()) and public.boleh_lihat_kegiatan(kegiatan_id));
create policy kegiatan_materi_tulis on public.kegiatan_materi for all to authenticated
  using (kelompok_id = (select public.kelompok_saya()) and public.boleh_kelola_kegiatan(kegiatan_id))
  with check (kelompok_id = (select public.kelompok_saya()) and public.boleh_kelola_kegiatan(kegiatan_id));

-- Presensi: wali hanya melihat baris anaknya sendiri, bukan seluruh kelas.
create policy presensi_select on public.presensi for select to authenticated
  using (
    kelompok_id = (select public.kelompok_saya())
    and (
      (select public.punya_peran('admin'))
      or (select public.punya_peran('pengurus'))
      or public.guru_mengajar_kegiatan(kegiatan_id)
      or public.wali_dari(generus_id)
    )
  );
create policy presensi_tulis on public.presensi for all to authenticated
  using (kelompok_id = (select public.kelompok_saya()) and public.boleh_kelola_kegiatan(kegiatan_id))
  with check (kelompok_id = (select public.kelompok_saya()) and public.boleh_kelola_kegiatan(kegiatan_id));

create policy susulan_select on public.susulan for select to authenticated
  using (kelompok_id = (select public.kelompok_saya()) and public.boleh_lihat_generus(generus_id));
create policy susulan_tulis on public.susulan for all to authenticated
  using (
    kelompok_id = (select public.kelompok_saya())
    and ((select public.punya_peran('admin')) or public.guru_mengajar_generus(generus_id))
  )
  with check (
    kelompok_id = (select public.kelompok_saya())
    and ((select public.punya_peran('admin')) or public.guru_mengajar_generus(generus_id))
  );

-- ── Penyiapan kegiatan rutin tanpa cron (ARCHITECTURE §4.4) ─────────
-- Idempoten: dipanggil saat halaman "Pengajian Hari Ini" dibuka.
-- security definer karena wali/pengurus juga membuka halaman tanggal tetapi tidak boleh menulis kegiatan.
create function public.siapkan_kegiatan(p_tanggal date) returns integer
language plpgsql security definer
set search_path = ''
as $$
declare
  v_kelompok uuid := public.kelompok_saya();
  v_jumlah integer;
begin
  if v_kelompok is null then
    raise exception 'Belum masuk' using errcode = '42501';
  end if;

  with baru as (
    insert into public.kegiatan (kelompok_id, jadwal_rutin_id, tanggal, jam_mulai, jam_selesai, jenis, diinput_oleh)
    select j.kelompok_id, j.id, p_tanggal, j.jam_mulai, j.jam_selesai, 'rutin', null
    from public.jadwal_rutin j
    where j.kelompok_id = v_kelompok
      and j.aktif
      and j.hari = extract(isodow from p_tanggal)
    on conflict (jadwal_rutin_id, tanggal) do nothing
    returning id, jadwal_rutin_id, kelompok_id
  ),
  kelas_baru as (
    insert into public.kegiatan_kelas (kelompok_id, kegiatan_id, kelas_id)
    select b.kelompok_id, b.id, jk.kelas_id
    from baru b join public.jadwal_rutin_kelas jk on jk.jadwal_rutin_id = b.jadwal_rutin_id
    returning 1
  ),
  pengajar_baru as (
    insert into public.kegiatan_pengajar (kelompok_id, kegiatan_id, guru_id)
    select b.kelompok_id, b.id, j.guru_id
    from baru b join public.jadwal_rutin j on j.id = b.jadwal_rutin_id
    where j.guru_id is not null
    returning 1
  )
  select count(*) into v_jumlah from baru;

  return v_jumlah;
end $$;

revoke execute on function public.siapkan_kegiatan(date) from public, anon;
grant execute on function public.siapkan_kegiatan(date) to authenticated;
