import "server-only";
import { createClient } from "@/lib/supabase/server";

export type KelasRow = Awaited<ReturnType<typeof daftarKelas>>[number];

/** Urut jenjang (urutan enum) → urutan → nama. Menyertakan jumlah anak aktif. */
export async function daftarKelas({ hanyaAktif = false } = {}) {
  const supabase = await createClient();
  let q = supabase
    .from("kelas")
    .select("id, jenjang, nama, urutan, aktif, generus(count)")
    .eq("generus.status", "aktif")
    .order("jenjang")
    .order("urutan")
    .order("nama");
  if (hanyaAktif) q = q.eq("aktif", true);
  const { data, error } = await q;
  if (error) throw error;
  return data.map(({ generus, ...k }) => ({ ...k, jumlahAnak: generus[0]?.count ?? 0 }));
}

export async function ambilKelas(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("kelas").select("id, jenjang, nama, urutan, aktif").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}
