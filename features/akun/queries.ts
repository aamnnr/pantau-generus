import "server-only";
import { createClient } from "@/lib/supabase/server";

export type AkunRow = Awaited<ReturnType<typeof daftarAkun>>[number];

export async function daftarAkun() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profil")
    .select("id, nama, no_hp, profil_peran (peran), generus_wali (generus:generus_id (nama))")
    .order("nama");
  if (error) throw error;
  return data.map(({ profil_peran, generus_wali, ...p }) => ({
    ...p,
    peran: profil_peran.map((r) => r.peran),
    anak: generus_wali.map((w) => w.generus?.nama).filter((n): n is string => !!n),
  }));
}

export async function ambilAkun(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profil")
    .select("id, nama, no_hp, profil_peran (peran), generus_wali (hubungan, generus:generus_id (id, nama))")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}
