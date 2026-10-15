import type { Peran } from "@/lib/format";

export type NavIcon =
  | "kalender"
  | "anak"
  | "target"
  | "menu"
  | "beranda"
  | "riwayat"
  | "raport"
  | "rekap"
  | "kelas"
  | "guru"
  | "akun"
  | "kitab"
  | "materi"
  | "tilawati";

export type NavItem = { href: string; label: string; icon: NavIcon };

const M = {
  beranda: { href: "/beranda", label: "Beranda", icon: "beranda" },
  hariIni: { href: "/hari-ini", label: "Hari Ini", icon: "kalender" },
  generus: { href: "/generus", label: "Generus", icon: "anak" },
  kelasku: { href: "/generus", label: "Kelasku", icon: "anak" },
  target: { href: "/target", label: "Target", icon: "target" },
  riwayat: { href: "/riwayat", label: "Riwayat", icon: "riwayat" },
  rekap: { href: "/rekap", label: "Rekap", icon: "rekap" },
  raport: { href: "/raport", label: "Raport", icon: "raport" },
  anakku: { href: "/anakku", label: "Anakku", icon: "anak" },
  lainnya: { href: "/lainnya", label: "Lainnya", icon: "menu" },
} satisfies Record<string, NavItem>;

/**
 * Navigasi bawah (HP) per peran — maksimal 4 item (DESIGN §5).
 * "Lainnya" ada di semua peran agar menu lain, Ganti Mode & Keluar selalu terjangkau.
 */
export const NAV_UTAMA: Record<Peran, NavItem[]> = {
  admin: [M.beranda, M.hariIni, M.generus, M.lainnya],
  guru: [M.beranda, M.hariIni, M.kelasku, M.lainnya],
  pengurus: [M.beranda, M.rekap, M.raport, M.lainnya],
  wali: [M.anakku, M.raport, M.lainnya],
};

/** Menu sidebar desktop (urutan lengkap). Item yang tidak ada di navigasi bawah muncul di Lainnya pada HP. */
export const NAV_SIDEBAR: Record<Peran, NavItem[]> = {
  admin: [M.beranda, M.hariIni, M.generus, M.target, M.riwayat, M.rekap, M.raport],
  guru: [M.beranda, M.hariIni, M.kelasku, M.target, M.riwayat, M.raport],
  pengurus: [M.beranda, M.rekap, M.raport, M.generus, M.target, M.riwayat],
  wali: [M.anakku, M.raport],
};

/** Menu yang di HP hanya bisa dicapai lewat Lainnya. */
export function menuLainnya(peran: Peran): NavItem[] {
  const bawah = new Set(NAV_UTAMA[peran].map((i) => i.href));
  return NAV_SIDEBAR[peran].filter((i) => !bawah.has(i.href));
}

const KELOLA = {
  jadwal: { href: "/kelola/jadwal", label: "Jadwal Rutin", icon: "kalender" },
  kelas: { href: "/kelola/kelas", label: "Kelas", icon: "kelas" },
  guru: { href: "/kelola/guru", label: "Guru", icon: "guru" },
  akun: { href: "/kelola/akun", label: "Akun & Wali", icon: "akun" },
  kitab: { href: "/kelola/kitab", label: "Kitab", icon: "kitab" },
  materi: { href: "/kelola/materi", label: "Materi", icon: "materi" },
  tilawati: { href: "/kelola/tilawati", label: "Jilid Tilawati", icon: "tilawati" },
} satisfies Record<string, NavItem>;

/**
 * Menu kelola per peran (PRD §4): admin mengubah semua, pengurus hanya melihat,
 * guru ikut mengelola materi item (target dikelola di halaman Target).
 */
export const NAV_KELOLA: Record<Peran, NavItem[]> = {
  admin: Object.values(KELOLA),
  pengurus: Object.values(KELOLA),
  guru: [KELOLA.materi],
  wali: [],
};
