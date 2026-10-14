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

/**
 * Navigasi bawah (HP) per peran — maksimal 4 item (DESIGN §5).
 * "Lainnya" ada di semua peran agar Ganti Mode & Keluar selalu terjangkau.
 */
export const NAV_UTAMA: Record<Peran, NavItem[]> = {
  admin: [
    { href: "/hari-ini", label: "Hari Ini", icon: "kalender" },
    { href: "/generus", label: "Generus", icon: "anak" },
    { href: "/target", label: "Target", icon: "target" },
    { href: "/lainnya", label: "Lainnya", icon: "menu" },
  ],
  guru: [
    { href: "/hari-ini", label: "Hari Ini", icon: "kalender" },
    { href: "/generus", label: "Kelasku", icon: "anak" },
    { href: "/riwayat", label: "Riwayat", icon: "riwayat" },
    { href: "/lainnya", label: "Lainnya", icon: "menu" },
  ],
  pengurus: [
    { href: "/beranda", label: "Beranda", icon: "beranda" },
    { href: "/generus", label: "Generus", icon: "anak" },
    { href: "/raport", label: "Raport", icon: "raport" },
    { href: "/lainnya", label: "Lainnya", icon: "menu" },
  ],
  wali: [
    { href: "/anakku", label: "Anakku", icon: "anak" },
    { href: "/raport", label: "Raport", icon: "raport" },
    { href: "/lainnya", label: "Lainnya", icon: "menu" },
  ],
};

const KELOLA = {
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

/** Pengurus melihat rekap dari sidebar desktop (di HP lewat Beranda). */
export const NAV_TAMBAHAN_DESKTOP: Partial<Record<Peran, NavItem[]>> = {
  pengurus: [{ href: "/rekap", label: "Rekap", icon: "rekap" }],
};
