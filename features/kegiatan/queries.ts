import "server-only";
import { geserTanggal, hariIni, type Jenjang, type StatusPresensi } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export type KelasRingkas = { id: string; nama: string; jenjang: Jenjang };

export type KegiatanRingkas = {
  id: string;
  tanggal: string;
  jam_mulai: string | null;
  jam_selesai: string | null;
  judul: string | null;
  jenis: "rutin" | "khusus";
  status: "terjadwal" | "selesai" | "batal";
  kelas: KelasRingkas[];
  pengajar: string[];
  jumlah_presensi: number;
  jumlah_materi: number;
};

/** Kolom view bertipe nullable (keterbatasan gen types untuk view) — rapikan di satu tempat. */
function ringkas(r: Record<keyof KegiatanRingkas, unknown>): KegiatanRingkas {
  return {
    ...(r as KegiatanRingkas),
    kelas: (r.kelas ?? []) as KelasRingkas[],
    pengajar: (r.pengajar ?? []) as string[],
    jumlah_presensi: Number(r.jumlah_presensi ?? 0),
    jumlah_materi: Number(r.jumlah_materi ?? 0),
  };
}

const KOLOM_RINGKAS = "id, tanggal, jam_mulai, jam_selesai, judul, jenis, status, kelas, pengajar, jumlah_presensi, jumlah_materi";

/**
 * Kegiatan pada satu tanggal. Kegiatan rutin disiapkan dulu dari jadwal (idempoten, tanpa cron —
 * ARCHITECTURE §4.4); RLS view membatasi guru ke kelasnya.
 */
export async function kegiatanTanggal(tanggal: string) {
  const supabase = await createClient();
  const { error: errSiap } = await supabase.rpc("siapkan_kegiatan", { p_tanggal: tanggal });
  if (errSiap) throw errSiap;

  const { data, error } = await supabase
    .from("v_kegiatan_ringkas")
    .select(KOLOM_RINGKAS)
    .eq("tanggal", tanggal)
    .order("jam_mulai", { nullsFirst: false });
  if (error) throw error;
  return data.map(ringkas);
}

/** Kegiatan yang sudah lewat (untuk halaman Riwayat). */
export async function riwayatKegiatan(hari = 60) {
  const supabase = await createClient();
  const sampai = hariIni();
  const { data, error } = await supabase
    .from("v_kegiatan_ringkas")
    .select(KOLOM_RINGKAS)
    .lte("tanggal", sampai)
    .gte("tanggal", geserTanggal(sampai, -hari))
    .order("tanggal", { ascending: false })
    .order("jam_mulai", { ascending: true, nullsFirst: false });
  if (error) throw error;
  return data.map(ringkas);
}

export async function ambilKegiatan(id: string) {
  const supabase = await createClient();
  const [{ data: k, error }, { data: r }, { data: materi }, { data: rundown }, { data: bolehKelola }] = await Promise.all([
    supabase
      .from("kegiatan")
      .select("id, tanggal, jam_mulai, jam_selesai, judul, jenis, status, catatan, jadwal_rutin_id, kegiatan_kelas (kelas_id), kegiatan_pengajar (guru_id)")
      .eq("id", id)
      .maybeSingle(),
    supabase.from("v_kegiatan_ringkas").select(KOLOM_RINGKAS).eq("id", id).maybeSingle(),
    supabase
      .from("v_kegiatan_materi")
      .select("id, kitab_id, kitab_nama, kitab_jenis, jenis, mulai, selesai, teks, mulai_surat, mulai_ayat, selesai_surat, selesai_ayat")
      .eq("kegiatan_id", id)
      .order("urutan"),
    supabase.from("kegiatan_rundown").select("urutan, waktu, aktivitas").eq("kegiatan_id", id).order("urutan"),
    supabase.rpc("boleh_kelola_kegiatan", { p_kegiatan_id: id }),
  ]);
  if (error) throw error;
  if (!k || !r) return null;
  return { ...k, ringkas: ringkas(r), materi: materi ?? [], rundown: rundown ?? [], bolehKelola: !!bolehKelola };
}

export type Peserta = {
  id: string;
  nama: string;
  kelasId: string | null;
  status: StatusPresensi | null;
  keterangan: string | null;
};

/**
 * Peserta presensi = generus aktif dari semua kelas kegiatan (PRD F3), ditambah anak yang
 * sudah punya presensi meski kini pindah kelas/nonaktif agar catatannya tetap terlihat.
 */
export async function pesertaKegiatan(kegiatanId: string, kelasIds: string[]): Promise<Peserta[]> {
  const supabase = await createClient();
  const [{ data: generus, error }, { data: presensi, error: errP }] = await Promise.all([
    supabase.from("generus").select("id, nama, kelas_id").in("kelas_id", kelasIds.length ? kelasIds : ["00000000-0000-0000-0000-000000000000"]).eq("status", "aktif"),
    supabase.from("presensi").select("generus_id, status, keterangan, generus:generus_id (nama, kelas_id)").eq("kegiatan_id", kegiatanId),
  ]);
  if (error) throw error;
  if (errP) throw errP;

  const byId = new Map<string, Peserta>();
  for (const g of generus) byId.set(g.id, { id: g.id, nama: g.nama, kelasId: g.kelas_id, status: null, keterangan: null });
  for (const p of presensi) {
    const ada = byId.get(p.generus_id);
    if (ada) {
      ada.status = p.status;
      ada.keterangan = p.keterangan;
    } else if (p.generus) {
      byId.set(p.generus_id, { id: p.generus_id, nama: p.generus.nama, kelasId: p.generus.kelas_id, status: p.status, keterangan: p.keterangan });
    }
  }
  return [...byId.values()].sort((a, b) => a.nama.localeCompare(b.nama, "id"));
}

export async function daftarSurat() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("quran_surat").select("nomor, nama_latin, jumlah_ayat").order("nomor");
  if (error) throw error;
  return data;
}

export async function kitabAktif() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("kitab")
    .select("id, nama, jenis, total_satuan")
    .eq("aktif", true)
    .order("jenis")
    .order("urutan")
    .order("nama");
  if (error) throw error;
  return data;
}

/** Kelas yang boleh dipilih untuk kegiatan: admin → semua, guru → kelas yang diajar. */
export async function kelasUntukKegiatan(userId: string, admin: boolean) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("kelas")
    .select("id, nama, jenjang, urutan, aktif, guru_kelas (guru:guru_id (profil_id))")
    .eq("aktif", true)
    .order("jenjang")
    .order("urutan")
    .order("nama");
  if (error) throw error;
  return data
    .filter((k) => admin || k.guru_kelas.some((gk) => gk.guru?.profil_id === userId))
    .map((k) => ({ id: k.id, nama: k.nama, jenjang: k.jenjang, urutan: k.urutan, aktif: k.aktif }));
}
