import "server-only";
import { createClient } from "@/lib/supabase/server";

export type MateriRow = Awaited<ReturnType<typeof daftarMateri>>[number];

export async function daftarMateri() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("materi_item")
    .select("id, aspek, mapel, nama, keterangan, jenjang, jenis_kelamin, urutan, aktif")
    .order("aspek")
    .order("mapel")
    .order("urutan")
    .order("nama");
  if (error) throw error;
  return data;
}

export async function ambilMateri(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("materi_item")
    .select("id, aspek, mapel, nama, keterangan, jenjang, jenis_kelamin, urutan, aktif")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Mapel yang sudah dipakai, untuk saran isian (digabung dengan saran PPG). */
export async function daftarMapel() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("materi_item").select("aspek, mapel");
  if (error) throw error;
  return data;
}
