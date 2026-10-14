-- Guru ikut mengelola materi item dan target (keputusan 14 Okt 2026, PRD §4).
-- Materi item berlaku sekelompok → semua guru boleh menulis.
-- Target dibatasi ke kelas yang diajar, pola sama dengan kegiatan gabungan.

-- ── Materi item ─────────────────────────────────────────────────────

drop policy materi_item_tulis on public.materi_item;
create policy materi_item_tulis on public.materi_item for all to authenticated
  using (
    kelompok_id = (select public.kelompok_saya())
    and ((select public.punya_peran('admin')) or (select public.punya_peran('guru')))
  )
  with check (
    kelompok_id = (select public.kelompok_saya())
    and ((select public.punya_peran('admin')) or (select public.punya_peran('guru')))
  );

-- ── Target ──────────────────────────────────────────────────────────

-- Pembuat target tetap bisa mengelolanya sebelum kelas ditautkan.
alter table public.target_bulanan
  add column dibuat_oleh uuid default auth.uid() references public.profil (id) on delete set null;

create function public.guru_mengajar_target(p_target_id uuid) returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.target_bulanan_kelas tk
    where tk.target_bulanan_id = p_target_id and public.guru_mengajar_kelas(tk.kelas_id)
  )
$$;

create function public.boleh_kelola_target(p_target_id uuid) returns boolean
language sql stable security definer
set search_path = ''
as $$
  select public.punya_peran('admin')
      or (
        public.punya_peran('guru')
        and (
          public.guru_mengajar_target(p_target_id)
          or exists (select 1 from public.target_bulanan where id = p_target_id and dibuat_oleh = auth.uid())
        )
      )
$$;

drop policy target_bulanan_tulis on public.target_bulanan;
create policy target_bulanan_insert on public.target_bulanan for insert to authenticated
  with check (
    kelompok_id = (select public.kelompok_saya())
    and ((select public.punya_peran('admin')) or (select public.punya_peran('guru')))
  );
create policy target_bulanan_update on public.target_bulanan for update to authenticated
  using (kelompok_id = (select public.kelompok_saya()) and public.boleh_kelola_target(id));
create policy target_bulanan_delete on public.target_bulanan for delete to authenticated
  using (kelompok_id = (select public.kelompok_saya()) and public.boleh_kelola_target(id));

-- Guru hanya boleh menautkan/melepas kelas yang diajarnya.
drop policy target_bulanan_kelas_tulis on public.target_bulanan_kelas;
create policy target_bulanan_kelas_tulis on public.target_bulanan_kelas for all to authenticated
  using (
    kelompok_id = (select public.kelompok_saya())
    and (
      (select public.punya_peran('admin'))
      or (public.guru_mengajar_kelas(kelas_id) and public.boleh_kelola_target(target_bulanan_id))
    )
  )
  with check (
    kelompok_id = (select public.kelompok_saya())
    and (
      (select public.punya_peran('admin'))
      or (public.guru_mengajar_kelas(kelas_id) and public.boleh_kelola_target(target_bulanan_id))
    )
  );

drop policy target_kitab_tulis on public.target_kitab;
create policy target_kitab_tulis on public.target_kitab for all to authenticated
  using (kelompok_id = (select public.kelompok_saya()) and public.boleh_kelola_target(target_bulanan_id))
  with check (kelompok_id = (select public.kelompok_saya()) and public.boleh_kelola_target(target_bulanan_id));

drop policy target_materi_tulis on public.target_materi;
create policy target_materi_tulis on public.target_materi for all to authenticated
  using (kelompok_id = (select public.kelompok_saya()) and public.boleh_kelola_target(target_bulanan_id))
  with check (kelompok_id = (select public.kelompok_saya()) and public.boleh_kelola_target(target_bulanan_id));

drop policy target_tilawati_tulis on public.target_tilawati;
create policy target_tilawati_tulis on public.target_tilawati for all to authenticated
  using (kelompok_id = (select public.kelompok_saya()) and public.boleh_kelola_target(target_bulanan_id))
  with check (kelompok_id = (select public.kelompok_saya()) and public.boleh_kelola_target(target_bulanan_id));
