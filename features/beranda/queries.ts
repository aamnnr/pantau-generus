import "server-only";
import { targetBerjalan } from "@/features/progres/queries";
import { rekapKelas } from "@/features/rekap/queries";
import type { Jenjang } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

type KelasDasar = { id: string; nama: string; jenjang: Jenjang };

/** Kehadiran per hari (SQL: fn_kehadiran_harian; RLS membatasi guru ke kelasnya). */
export async function kehadiranHarian(dari: string, sampai: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("fn_kehadiran_harian", { p_dari: dari, p_sampai: sampai });
  if (error) throw error;
  return data;
}

/** Capaian target periode berjalan per kelas: rata-rata butir tuntas & materi diikuti (fn_rekap_kelas_ringkas). */
export async function capaianTargetBerjalan(kelas: KelasDasar[], hari: string) {
  const supabase = await createClient();
  const hasil = await Promise.all(
    kelas.map(async (k) => {
      const t = await targetBerjalan(k.id, hari);
      if (!t) return null;
      const { data, error } = await supabase
        .rpc("fn_rekap_kelas_ringkas", { p_kelas_id: k.id, p_dari: t.mulai, p_sampai: t.selesai })
        .single();
      if (error) throw error;
      return { kelas: k, target: t, ...data };
    }),
  );
  return hasil.filter((x): x is NonNullable<typeof x> => !!x);
}

/** Anak dengan kehadiran di bawah ambang pada rentang tanggal (bulan berjalan di Beranda). */
export async function perluPerhatian(kelas: KelasDasar[], dari: string, sampai: string) {
  const rekap = await Promise.all(kelas.map(async (k) => ({ kelas: k, ...(await rekapKelas(k.id, dari, sampai)) })));
  return rekap.flatMap((r) => r.anak.filter((a) => a.perlu_perhatian).map((a) => ({ ...a, kelas: r.kelas })));
}
