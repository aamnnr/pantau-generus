-- Daftar kelas baku (PRD §5) untuk SEMUA kelompok. Aman dijalankan berulang (nama yang sudah ada dilewati,
-- urutan & jenjang disamakan). Dijalankan sekali per lingkungan, mis.:
--   pnpm exec supabase db query --linked -f supabase/data/kelas-awal.sql          (dev)
--   pnpm exec supabase db query --db-url "<produksi>" -f supabase/data/kelas-awal.sql
insert into public.kelas (kelompok_id, jenjang, nama, urutan)
select k.id, d.jenjang::public.jenjang, d.nama, d.urutan
from public.kelompok k
cross join (values
  ('caberawit', 'TK', 0),
  ('caberawit', '1A', 1),
  ('caberawit', '1B', 2),
  ('caberawit', '2A', 3),
  ('caberawit', '2B', 4),
  ('caberawit', '3A', 5),
  ('caberawit', '3B', 6),
  ('pra_remaja', 'Pra-remaja', 0),
  ('remaja', 'Usia sekolah (SLTA)', 0),
  ('remaja', 'Usia mandiri', 1)
) as d (jenjang, nama, urutan)
on conflict (kelompok_id, nama) do update set jenjang = excluded.jenjang, urutan = excluded.urutan;
