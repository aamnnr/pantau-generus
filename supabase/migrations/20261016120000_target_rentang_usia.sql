-- Target Caberawit dari PPG memakai rentang usia; pembagian usia ke kelas belum pasti, jadi target tetap
-- dipasang per kelas dan rentang usia disimpan sebagai keterangan (PRD §5).
alter table public.target_bulanan add column rentang_usia text check (rentang_usia is null or length(trim(rentang_usia)) between 1 and 60);

-- Kolom baru ditambahkan di akhir view.
create or replace view public.v_target_ringkas with (security_invoker = true) as
select
  t.id,
  t.kelompok_id,
  t.judul,
  t.semester,
  t.mulai,
  t.selesai,
  t.catatan,
  t.dibuat_oleh,
  coalesce((
    select jsonb_agg(jsonb_build_object('id', kl.id, 'nama', kl.nama, 'jenjang', kl.jenjang)
                     order by kl.jenjang, kl.urutan, kl.nama)
    from public.target_bulanan_kelas tk join public.kelas kl on kl.id = tk.kelas_id
    where tk.target_bulanan_id = t.id
  ), '[]'::jsonb) as kelas,
  (select count(*) from public.target_kitab x where x.target_bulanan_id = t.id)::int as jumlah_kitab,
  (select count(*) from public.target_materi x where x.target_bulanan_id = t.id)::int as jumlah_materi,
  exists (select 1 from public.target_tilawati x where x.target_bulanan_id = t.id) as ada_tilawati,
  public.boleh_kelola_target(t.id) as boleh_kelola,
  t.rentang_usia
from public.target_bulanan t;
