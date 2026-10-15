-- fn_capaian_target_kitab ikut mengembalikan jenis kitab agar satuan (hal./ayat) tidak ditebak dari teks.
drop function public.fn_capaian_target_kitab(uuid, uuid);

create function public.fn_capaian_target_kitab(p_generus_id uuid, p_target_id uuid)
returns table (
  id uuid, kitab_id uuid, kitab_nama text, kitab_jenis public.jenis_kitab, jenis public.jenis_materi_kitab, teks text,
  total integer, diikuti integer, kelas integer
)
language sql stable
set search_path = ''
as $$
  select
    t.id, t.kitab_id, t.kitab_nama, t.kitab_jenis, t.jenis, t.teks,
    (t.selesai - t.mulai + 1)::integer,
    (select count(*) from public.v_satuan_diikuti v
      where v.generus_id = p_generus_id and v.kitab_id = t.kitab_id and v.jenis = t.jenis
        and v.satuan between t.mulai and t.selesai)::integer,
    (select count(*) from public.v_satuan_disampaikan v
      where v.kelas_id = (select g.kelas_id from public.generus g where g.id = p_generus_id)
        and v.kitab_id = t.kitab_id and v.jenis = t.jenis
        and v.satuan between t.mulai and t.selesai)::integer
  from public.v_target_kitab t
  where t.target_bulanan_id = p_target_id
  order by t.jenis, t.urutan
$$;
