import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function daftarKitab() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("kitab")
    .select("id, nama, jenis, satuan, total_satuan, urutan, aktif")
    .order("jenis") // urutan enum: quran lalu hadist
    .order("urutan")
    .order("nama");
  if (error) throw error;
  return data;
}

export async function ambilKitab(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("kitab")
    .select("id, nama, jenis, total_satuan, urutan, aktif")
    .eq("id", id)
    .eq("jenis", "hadist")
    .maybeSingle();
  if (error) throw error;
  return data;
}
