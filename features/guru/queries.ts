import "server-only";
import { createClient } from "@/lib/supabase/server";

export type GuruRow = Awaited<ReturnType<typeof daftarGuru>>[number];

export async function daftarGuru() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("guru")
    .select("id, nama, no_hp, aktif, profil_id, guru_kelas (kelas:kelas_id (id, nama, jenjang))")
    .order("aktif", { ascending: false })
    .order("nama");
  if (error) throw error;
  return data.map(({ guru_kelas, ...g }) => ({
    ...g,
    kelas: guru_kelas.map((gk) => gk.kelas).filter((k): k is NonNullable<typeof k> => !!k),
  }));
}

export async function ambilGuru(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("guru")
    .select("id, nama, no_hp, aktif, profil_id, guru_kelas (kelas_id)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}
