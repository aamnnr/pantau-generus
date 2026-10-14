import "server-only";
import { createClient } from "@/lib/supabase/server";

export type GenerusRow = Awaited<ReturnType<typeof daftarGenerus>>[number];

/** Semua generus yang boleh dilihat pengguna (RLS: guru → kelasnya, wali → anaknya). */
export async function daftarGenerus() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("generus")
    .select("id, nama, jenis_kelamin, status, kelas:kelas_id (id, nama, jenjang), generus_wali (profil:profil_id (nama))")
    .order("nama");
  if (error) throw error;
  return data.map(({ generus_wali, ...g }) => ({
    ...g,
    wali: generus_wali.map((w) => w.profil?.nama).filter((n): n is string => !!n),
  }));
}

export async function ambilGenerus(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("generus")
    .select("id, nama, jenis_kelamin, tanggal_lahir, kelas_id, status, generus_wali (profil_id, hubungan)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Akun berperan wali, untuk dipilih di formulir generus. */
export async function daftarAkunWali() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profil_peran")
    .select("profil:profil_id (id, nama, no_hp)")
    .eq("peran", "wali");
  if (error) throw error;
  return data
    .map((r) => r.profil)
    .filter((p): p is { id: string; nama: string; no_hp: string } => !!p)
    .sort((a, b) => a.nama.localeCompare(b.nama, "id"));
}
