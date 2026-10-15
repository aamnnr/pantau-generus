import "server-only";
import type { KelasRingkas } from "@/features/kegiatan/queries";
import type { Jenjang } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export type TargetRingkas = {
  id: string;
  judul: string;
  semester: string | null;
  rentang_usia: string | null;
  mulai: string;
  selesai: string;
  catatan: string | null;
  kelas: KelasRingkas[];
  jumlah_kitab: number;
  jumlah_materi: number;
  ada_tilawati: boolean;
  boleh_kelola: boolean;
};

const KOLOM = "id, judul, semester, rentang_usia, mulai, selesai, catatan, kelas, jumlah_kitab, jumlah_materi, ada_tilawati, boleh_kelola";

function ringkas(r: Record<keyof TargetRingkas, unknown>): TargetRingkas {
  return {
    ...(r as TargetRingkas),
    kelas: (r.kelas ?? []) as KelasRingkas[],
    jumlah_kitab: Number(r.jumlah_kitab ?? 0),
    jumlah_materi: Number(r.jumlah_materi ?? 0),
    ada_tilawati: !!r.ada_tilawati,
    boleh_kelola: !!r.boleh_kelola,
  };
}

/** Semua periode target, terbaru dulu. Semua pengguna masuk boleh melihat (ARCHITECTURE §6). */
export async function daftarTarget() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("v_target_ringkas").select(KOLOM).order("mulai", { ascending: false });
  if (error) throw error;
  return data.map(ringkas);
}

export async function ambilTarget(id: string) {
  const supabase = await createClient();
  const [{ data: r, error }, { data: kitab }, { data: materi }, { data: tilawati }] = await Promise.all([
    supabase.from("v_target_ringkas").select(KOLOM).eq("id", id).maybeSingle(),
    supabase
      .from("v_target_kitab")
      .select("id, kitab_id, kitab_nama, kitab_jenis, jenis, mulai, selesai, teks, mulai_surat, mulai_ayat, selesai_surat, selesai_ayat")
      .eq("target_bulanan_id", id)
      .order("urutan"),
    supabase
      .from("target_materi")
      .select("materi_item:materi_item_id (id, nama, aspek, mapel, jenis_kelamin)")
      .eq("target_bulanan_id", id),
    supabase.from("target_tilawati").select("jilid, halaman").eq("target_bulanan_id", id).maybeSingle(),
  ]);
  if (error) throw error;
  if (!r) return null;
  return {
    ...ringkas(r),
    kitab: kitab ?? [],
    materi: (materi ?? []).map((m) => m.materi_item).filter((m): m is NonNullable<typeof m> => !!m),
    tilawati: tilawati ?? null,
  };
}

/** Butir materi aktif yang berlaku untuk jenjang kelas target (butir tanpa jenjang = semua). */
export async function opsiMateriTarget(jenjang: Jenjang[], terpilih: string[]) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("materi_item")
    .select("id, nama, aspek, mapel, jenjang, jenis_kelamin, aktif")
    .order("aspek")
    .order("mapel")
    .order("urutan")
    .order("nama");
  if (error) throw error;
  return data
    .filter((m) => terpilih.includes(m.id) || (m.aktif && (!m.jenjang || jenjang.includes(m.jenjang))))
    .map((m) => ({ id: m.id, nama: m.nama, aspek: m.aspek, mapel: m.mapel, jenis_kelamin: m.jenis_kelamin, target: false }));
}

export async function daftarJilid() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("jilid_tilawati").select("jilid, total_halaman").order("jilid");
  if (error) throw error;
  return data;
}
