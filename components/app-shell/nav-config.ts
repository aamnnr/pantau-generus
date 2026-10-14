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

/** Menu kelola master data. Admin mengubah; pengurus hanya melihat (PRD §4). */
export const NAV_KELOLA: NavItem[] = [
  { href: "/kelola/kelas", label: "Kelas", icon: "kelas" },
  { href: "/kelola/guru", label: "Guru", icon: "guru" },
  { href: "/kelola/akun", label: "Akun & Wali", icon: "akun" },
  { href: "/kelola/kitab", label: "Kitab", icon: "kitab" },
  { href: "/kelola/materi", label: "Materi", icon: "materi" },
  { href: "/kelola/tilawati", label: "Jilid Tilawati", icon: "tilawati" },
];

export const PERAN_KELOLA: Peran[] = ["admin", "pengurus"];

/** Pengurus melihat rekap dari sidebar desktop (di HP lewat Beranda). */
export const NAV_TAMBAHAN_DESKTOP: Partial<Record<Peran, NavItem[]>> = {
  pengurus: [{ href: "/rekap", label: "Rekap", icon: "rekap" }],
};
