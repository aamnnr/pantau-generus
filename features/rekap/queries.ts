import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { TargetPeriode } from "@/lib/periode";

/** Semua periode target (untuk pilihan periode "Target"). */
export async function daftarTargetPeriode(): Promise<TargetPeriode[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("target_bulanan").select("id, judul, mulai, selesai").order("mulai");
  if (error) throw error;
  return data;
}

/** Rekap per anak + ringkasan kelas (dihitung di SQL: fn_rekap_kelas, fn_rekap_kelas_ringkas). */
export async function rekapKelas(kelasId: string, dari: string, sampai: string) {
  const supabase = await createClient();
  const [anak, ringkas] = await Promise.all([
    supabase.rpc("fn_rekap_kelas", { p_kelas_id: kelasId, p_dari: dari, p_sampai: sampai }),
    supabase.rpc("fn_rekap_kelas_ringkas", { p_kelas_id: kelasId, p_dari: dari, p_sampai: sampai }).single(),
  ]);
  if (anak.error) throw anak.error;
  if (ringkas.error) throw ringkas.error;
  return { anak: anak.data, ringkas: ringkas.data };
}

export type RekapAnak = Awaited<ReturnType<typeof rekapKelas>>["anak"][number];
