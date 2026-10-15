import { TZDate } from "@date-fns/tz";
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import type { Database } from "@/types/database";

type Enums = Database["public"]["Enums"];
export type Peran = Enums["peran"];
export type Jenjang = Enums["jenjang"];
export type Aspek = Enums["aspek"];
export type JenisKelamin = Enums["jenis_kelamin"];
export type StatusGenerus = Enums["status_generus"];
export type StatusPenilaian = Enums["status_penilaian"];

export const ZONA = "Asia/Jakarta";

/** Tanggal hari ini menurut WIB, format `YYYY-MM-DD` (sama dengan kolom `date` di DB). */
export function hariIni(): string {
  return format(TZDate.tz(ZONA), "yyyy-MM-dd");
}

/** "Senin, 13 Okt 2026" (DESIGN §8). */
export function formatTanggal(tanggal: string): string {
  return format(parseISO(tanggal), "EEEE, d MMM yyyy", { locale: id });
}

/** "13 Okt 2026". */
export function formatTanggalPendek(tanggal: string): string {
  return format(parseISO(tanggal), "d MMM yyyy", { locale: id });
}

/** 6281234567890 → 0812-3456-7890 (lebih mudah dibaca daripada format 62…). */
export function formatNoHp(nomor: string | null | undefined): string {
  if (!nomor) return "";
  const lokal = nomor.startsWith("62") ? `0${nomor.slice(2)}` : nomor;
  return lokal.replace(/^(\d{4})(\d{4})(\d+)$/, "$1-$2-$3");
}

/** Huruf awal dua kata pertama; kata yang tidak diawali huruf (mis. "(uji)") dilewati. */
export function inisial(nama: string): string {
  const kata = nama.trim().split(/\s+/).filter((k) => /^\p{L}/u.test(k));
  return ((kata[0]?.[0] ?? "") + (kata[1]?.[0] ?? "")).toUpperCase();
}

export const LABEL_PERAN: Record<Peran, string> = {
  admin: "Admin",
  guru: "Guru",
  pengurus: "Pengurus",
  wali: "Wali",
};

export const LABEL_JENJANG: Record<Jenjang, string> = {
  caberawit: "Caberawit",
  pra_remaja: "Pra-remaja",
  remaja: "Remaja",
};

export const URUTAN_JENJANG: Jenjang[] = ["caberawit", "pra_remaja", "remaja"];

export const LABEL_ASPEK: Record<Aspek, string> = {
  alim: "Alim",
  faqih: "Faqih",
  akhlaqul_karimah: "Akhlaqul Karimah",
  mandiri: "Mandiri",
};

export const URUTAN_ASPEK: Aspek[] = ["alim", "faqih", "akhlaqul_karimah", "mandiri"];

/** Mapel yang lazim di dokumen PPG — hanya saran, admin boleh mengetik mapel lain. */
export const SARAN_MAPEL: Record<Aspek, string[]> = {
  alim: ["Hafalan"],
  faqih: ["Kefahaman Agama", "Praktek Ibadah"],
  akhlaqul_karimah: ["Akhlaq", "Tata Krama"],
  mandiri: ["Kemandirian", "Olahraga & Seni"],
};

export const LABEL_JENIS_KELAMIN: Record<JenisKelamin, string> = {
  laki_laki: "Laki-laki",
  perempuan: "Perempuan",
};

export const LABEL_STATUS_GENERUS: Record<StatusGenerus, string> = {
  aktif: "Aktif",
  lulus: "Lulus",
  pindah: "Pindah",
  nonaktif: "Nonaktif",
};

/** Tiga tingkat yang sama di DB, label mengikuti aspek (PRD F6, DESIGN §3). */
export function labelPenilaian(aspek: Aspek, status: StatusPenilaian): string {
  if (status === "belum") return "Belum";
  if (status === "proses") return "Proses";
  if (aspek === "faqih") return "Paham";
  if (aspek === "alim") return "Lancar";
  return "Terbiasa";
}

/** "Caberawit · 1B", "Pra-remaja", "Remaja · Pelajar" — nama kelas tidak diulang bila sama dengan jenjang. */
export function labelKelas(kelas: { jenjang: Jenjang; nama: string }): string {
  const jenjang = LABEL_JENJANG[kelas.jenjang];
  return kelas.nama === jenjang ? jenjang : `${jenjang} · ${kelas.nama}`;
}

/**
 * Kelas sebuah kegiatan (DESIGN §7.2): satu kelas → "Caberawit · 1A";
 * gabungan → "Pelajar + Pra-nikah", atau "Caberawit 1A + 1B" bila satu jenjang Caberawit.
 */
export function labelKelasKegiatan(kelas: { jenjang: Jenjang; nama: string }[]): string {
  if (kelas.length === 0) return "Tanpa kelas";
  if (kelas.length === 1) return labelKelas(kelas[0]);
  const jenjang = new Set(kelas.map((k) => k.jenjang));
  if (jenjang.size === 1 && kelas[0].jenjang === "caberawit") {
    return `Caberawit ${kelas.map((k) => k.nama).join(" + ")}`;
  }
  return kelas.map((k) => k.nama).join(" + ");
}

export const LABEL_HARI = ["", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"] as const;

/** "19:30:00" → "19.30" (format jam Indonesia, DESIGN §8). */
export function formatJam(jam: string | null | undefined): string {
  if (!jam) return "";
  return jam.slice(0, 5).replace(":", ".");
}

export function formatRentangJam(mulai: string | null, selesai: string | null): string {
  if (!mulai) return "";
  return selesai ? `${formatJam(mulai)}–${formatJam(selesai)}` : formatJam(mulai);
}

/** Geser tanggal `YYYY-MM-DD` sebanyak n hari (tanpa terpengaruh zona waktu server). */
export function geserTanggal(tanggal: string, n: number): string {
  const d = new Date(`${tanggal}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export type StatusPresensi = Enums["status_presensi"];

export const URUTAN_PRESENSI: StatusPresensi[] = ["hadir", "terlambat", "izin", "sakit", "alpa"];

export const LABEL_PRESENSI: Record<StatusPresensi, string> = {
  hadir: "Hadir",
  terlambat: "Terlambat",
  izin: "Izin",
  sakit: "Sakit",
  alpa: "Alpa",
};

/** "Jilid 3 · hal. 24" (DESIGN §7.4a). */
export function teksPosisiTilawati(p: { jilid: number | null; halaman: number | null } | null | undefined): string {
  return p?.jilid != null ? `Jilid ${p.jilid} · hal. ${p.halaman ?? 0}` : "Posisi belum diisi";
}
