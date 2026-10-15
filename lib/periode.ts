import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import { geserTanggal } from "@/lib/format";

/**
 * Pilihan periode Rekap/Progres/Raport (PRD F7): Bulan · Periode target · Semester · Keseluruhan.
 * Semester tetap: 1 = Juli–Desember, 2 = Januari–Juni (tahun ajaran Juli–Juni).
 * Semua periode diterjemahkan ke rentang tanggal untuk fungsi SQL.
 */
export type JenisPeriode = "bulan" | "target" | "semester" | "semua";

export const JENIS_PERIODE: { value: JenisPeriode; label: string }[] = [
  { value: "bulan", label: "Bulan" },
  { value: "target", label: "Target" },
  { value: "semester", label: "Semester" },
  { value: "semua", label: "Semua" },
];

export type CariPeriode = { periode?: string; bulan?: string; semester?: string; target?: string };
export type TargetPeriode = { id: string; judul: string; mulai: string; selesai: string };

export type Periode = {
  jenis: JenisPeriode;
  dari: string;
  sampai: string;
  label: string;
  /** Parameter URL periode ini (dipakai tautan agar periode ikut terbawa). */
  param: Record<string, string>;
  sebelum?: Record<string, string>;
  sesudah?: Record<string, string>;
  targetId?: string;
  /** Dipilih "Target" tetapi belum ada periode target sama sekali. */
  kosong?: boolean;
};

const AWAL = "2000-01-01";

function akhirBulan(bulan: string) {
  const [y, m] = bulan.split("-").map(Number);
  return geserTanggal(`${m === 12 ? y + 1 : y}-${String(m === 12 ? 1 : m + 1).padStart(2, "0")}-01`, -1);
}

function geserBulan(bulan: string, n: number) {
  const [y, m] = bulan.split("-").map(Number);
  const total = y * 12 + (m - 1) + n;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}`;
}

function semesterDari(hari: string) {
  const [y, m] = hari.split("-").map(Number);
  return m >= 7 ? { tahun: y, ke: 1 } : { tahun: y - 1, ke: 2 };
}

function geserSemester(s: { tahun: number; ke: number }, n: number) {
  const urut = s.tahun * 2 + (s.ke - 1) + n;
  return { tahun: Math.floor(urut / 2), ke: (urut % 2) + 1 };
}

const kunciSemester = (s: { tahun: number; ke: number }) => `${s.tahun}-${s.ke}`;

export function bacaPeriode(cari: CariPeriode, hari: string, target: TargetPeriode[], bawaan: JenisPeriode): Periode {
  const jenis = (JENIS_PERIODE.some((j) => j.value === cari.periode) ? cari.periode : bawaan) as JenisPeriode;

  if (jenis === "bulan") {
    const bulan = /^\d{4}-(0[1-9]|1[0-2])$/.test(cari.bulan ?? "") ? cari.bulan! : hari.slice(0, 7);
    return {
      jenis,
      dari: `${bulan}-01`,
      sampai: akhirBulan(bulan),
      label: format(parseISO(`${bulan}-01`), "MMMM yyyy", { locale: id }),
      param: { periode: "bulan", bulan },
      sebelum: { periode: "bulan", bulan: geserBulan(bulan, -1) },
      sesudah: { periode: "bulan", bulan: geserBulan(bulan, 1) },
    };
  }

  if (jenis === "semester") {
    const cocok = /^(\d{4})-([12])$/.exec(cari.semester ?? "");
    const s = cocok ? { tahun: Number(cocok[1]), ke: Number(cocok[2]) } : semesterDari(hari);
    const tahunKalender = s.ke === 1 ? s.tahun : s.tahun + 1;
    return {
      jenis,
      dari: s.ke === 1 ? `${tahunKalender}-07-01` : `${tahunKalender}-01-01`,
      sampai: s.ke === 1 ? `${tahunKalender}-12-31` : `${tahunKalender}-06-30`,
      label: `Semester ${s.ke} · ${s.tahun}/${s.tahun + 1}`,
      param: { periode: "semester", semester: kunciSemester(s) },
      sebelum: { periode: "semester", semester: kunciSemester(geserSemester(s, -1)) },
      sesudah: { periode: "semester", semester: kunciSemester(geserSemester(s, 1)) },
    };
  }

  if (jenis === "target") {
    // Urut mulai lama → baru; bawaan = periode yang sedang berjalan, atau yang terakhir dimulai.
    const urut = [...target].sort((a, b) => a.mulai.localeCompare(b.mulai));
    const i = urut.findIndex((t) => t.id === cari.target);
    const bawaanI = urut.findIndex((t) => t.mulai <= hari && t.selesai >= hari);
    const pilih = i >= 0 ? i : bawaanI >= 0 ? bawaanI : urut.findLastIndex((t) => t.mulai <= hari);
    const t = urut[pilih] ?? urut.at(-1);
    if (t) {
      const p = urut.indexOf(t);
      return {
        jenis,
        dari: t.mulai,
        sampai: t.selesai,
        label: `${t.judul} (${format(parseISO(t.mulai), "d MMM", { locale: id })} – ${format(parseISO(t.selesai), "d MMM yyyy", { locale: id })})`,
        param: { periode: "target", target: t.id },
        sebelum: urut[p - 1] && { periode: "target", target: urut[p - 1].id },
        sesudah: urut[p + 1] && { periode: "target", target: urut[p + 1].id },
        targetId: t.id,
      };
    }
    // Belum ada target: tetap di pilihan Target (jangan diam-diam pindah ke Semua) dengan rentang kosong.
    return { jenis, dari: hari, sampai: geserTanggal(hari, -1), label: "Belum ada periode target", param: { periode: "target" }, kosong: true };
  }

  return { jenis: "semua", dari: AWAL, sampai: hari, label: "Keseluruhan", param: { periode: "semua" } };
}

/** Gabungkan parameter (mis. kelas) dengan parameter periode menjadi query string. */
export function hrefDengan(base: string, ...bagian: (Record<string, string | undefined> | undefined)[]) {
  const q = new URLSearchParams();
  for (const b of bagian) for (const [k, v] of Object.entries(b ?? {})) if (v) q.set(k, v);
  const s = q.toString();
  return s ? `${base}?${s}` : base;
}
