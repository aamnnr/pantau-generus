import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function namaKelompok() {
  const supabase = await createClient();
  const { data } = await supabase.from("kelompok").select("nama").maybeSingle();
  return data?.nama ?? "";
}

/** Catatan raport per bulan (kunci = tanggal 1) dalam rentang periode. */
export async function catatanRaport(generusId: string, dari: string, sampai: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("catatan_raport")
    .select("bulan, catatan")
    .eq("generus_id", generusId)
    .gte("bulan", `${dari.slice(0, 7)}-01`)
    .lte("bulan", sampai)
    .order("bulan");
  if (error) throw error;
  return data;
}

/** Penulis catatan raport (RLS catatan_raport_tulis): admin, pengurus, atau guru kelas anak. */
export async function bolehTulisCatatan(generusId: string, peran: string[]) {
  if (peran.includes("admin") || peran.includes("pengurus")) return true;
  const supabase = await createClient();
  const { data } = await supabase.rpc("boleh_nilai_generus", { p_generus_id: generusId });
  return !!data;
}
