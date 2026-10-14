-- Materi item (hafalan, faqih, akhlaq, mandiri) yang disampaikan di sebuah kegiatan (keputusan 14 Okt 2026).
-- Anak yang hadir/terlambat dianggap sudah menerima; status Lancar/Paham/Terbiasa tetap lewat penilaian.

create table public.kegiatan_materi_item (
  id uuid primary key default gen_random_uuid(),
  kelompok_id uuid not null default public.kelompok_saya() references public.kelompok (id),
  kegiatan_id uuid not null references public.kegiatan (id) on delete cascade,
  materi_item_id uuid not null references public.materi_item (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (kegiatan_id, materi_item_id)
);
create index on public.kegiatan_materi_item (materi_item_id);

create trigger set_updated_at before update on public.kegiatan_materi_item
  for each row execute function public.set_updated_at();

alter table public.kegiatan_materi_item enable row level security;

create policy kegiatan_materi_item_select on public.kegiatan_materi_item for select to authenticated
  using (kelompok_id = (select public.kelompok_saya()) and public.boleh_lihat_kegiatan(kegiatan_id));
create policy kegiatan_materi_item_tulis on public.kegiatan_materi_item for all to authenticated
  using (kelompok_id = (select public.kelompok_saya()) and public.boleh_kelola_kegiatan(kegiatan_id))
  with check (kelompok_id = (select public.kelompok_saya()) and public.boleh_kelola_kegiatan(kegiatan_id));

-- Ganti seluruh pilihan materi item kegiatan secara atomik.
create function public.simpan_materi_item_kegiatan(p_kegiatan_id uuid, p_materi_item_ids uuid[]) returns void
language plpgsql
set search_path = ''
as $$
declare
  v_kelompok uuid;
begin
  if not public.boleh_kelola_kegiatan(p_kegiatan_id) then
    raise exception 'Anda tidak memiliki akses ke kegiatan ini' using errcode = '42501';
  end if;
  select kelompok_id into v_kelompok from public.kegiatan where id = p_kegiatan_id;

  delete from public.kegiatan_materi_item
  where kegiatan_id = p_kegiatan_id and materi_item_id <> all (coalesce(p_materi_item_ids, '{}'));
  insert into public.kegiatan_materi_item (kelompok_id, kegiatan_id, materi_item_id)
  select v_kelompok, p_kegiatan_id, x from unnest(coalesce(p_materi_item_ids, '{}')) as x
  on conflict (kegiatan_id, materi_item_id) do nothing;
end $$;

revoke execute on function public.simpan_materi_item_kegiatan(uuid, uuid[]) from public, anon;
grant execute on function public.simpan_materi_item_kegiatan(uuid, uuid[]) to authenticated;

-- Butir target periode yang berlaku untuk kelas-kelas kegiatan pada tanggalnya (ditampilkan paling atas).
create function public.materi_item_target_kegiatan(p_kegiatan_id uuid) returns setof uuid
language sql stable
set search_path = ''
as $$
  select distinct tm.materi_item_id
  from public.kegiatan k
  join public.kegiatan_kelas kk on kk.kegiatan_id = k.id
  join public.target_bulanan_kelas tk on tk.kelas_id = kk.kelas_id
  join public.target_bulanan t on t.id = tk.target_bulanan_id and k.tanggal between t.mulai and t.selesai
  join public.target_materi tm on tm.target_bulanan_id = t.id
  where k.id = p_kegiatan_id
$$;

-- Ringkasan kegiatan ikut menghitung materi item (kolom baru ditambahkan di akhir).
create or replace view public.v_kegiatan_ringkas with (security_invoker = true) as
select
  k.id,
  k.kelompok_id,
  k.tanggal,
  k.jam_mulai,
  k.jam_selesai,
  k.judul,
  k.jenis,
  k.status,
  k.jadwal_rutin_id,
  coalesce((
    select jsonb_agg(jsonb_build_object('id', kl.id, 'nama', kl.nama, 'jenjang', kl.jenjang)
                     order by kl.jenjang, kl.urutan, kl.nama)
    from public.kegiatan_kelas kk join public.kelas kl on kl.id = kk.kelas_id
    where kk.kegiatan_id = k.id
  ), '[]'::jsonb) as kelas,
  coalesce((
    select array_agg(g.nama order by g.nama)
    from public.kegiatan_pengajar kp join public.guru g on g.id = kp.guru_id
    where kp.kegiatan_id = k.id
  ), '{}') as pengajar,
  (select count(*) from public.presensi p where p.kegiatan_id = k.id)::int as jumlah_presensi,
  (select count(*) from public.kegiatan_materi m where m.kegiatan_id = k.id)::int as jumlah_materi,
  (select count(*) from public.kegiatan_materi_item mi where mi.kegiatan_id = k.id)::int as jumlah_materi_item
from public.kegiatan k;
