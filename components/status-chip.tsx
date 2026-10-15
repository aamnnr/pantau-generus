import { cn } from "@/lib/utils";

const NADA = {
  hijau: "bg-ok-soft text-ok",
  kunyit: "bg-warn-soft text-warn",
  biru: "bg-info-soft text-info",
  ungu: "bg-ungu-soft text-ungu",
  merah: "bg-bahaya-soft text-bahaya",
  abu: "bg-secondary text-teks-2",
} as const;

export type Nada = keyof typeof NADA;

/** Chip status: selalu simbol + kata, bukan warna saja (DESIGN §1.6). */
export function StatusChip({ nada, simbol, children, className }: {
  nada: Nada;
  simbol?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex h-7 shrink-0 items-center gap-1 rounded-full px-2.5 text-sm font-semibold whitespace-nowrap", NADA[nada], className)}>
      {simbol && <span aria-hidden>{simbol}</span>}
      {children}
    </span>
  );
}

// ︎ memaksa simbol tampil sebagai teks, bukan emoji berwarna.
export const CHIP_PRESENSI = {
  hadir: { nada: "hijau", simbol: "✓" },
  terlambat: { nada: "kunyit", simbol: "⏱︎" },
  izin: { nada: "biru", simbol: "✉︎" },
  sakit: { nada: "ungu", simbol: "✚" },
  alpa: { nada: "merah", simbol: "✕" },
} as const satisfies Record<string, { nada: Nada; simbol: string }>;

export const CHIP_STATUS_GENERUS = {
  aktif: { nada: "hijau", simbol: "●" },
  lulus: { nada: "kunyit", simbol: "◆" },
  pindah: { nada: "biru", simbol: "→" },
  nonaktif: { nada: "abu", simbol: "○" },
} as const satisfies Record<string, { nada: Nada; simbol: string }>;

// Tiga tingkat penilaian (DESIGN §3): simbol + label sesuai aspek (labelPenilaian).
export const CHIP_PENILAIAN = {
  belum: { nada: "abu", simbol: "○" },
  proses: { nada: "kunyit", simbol: "◐" },
  lancar: { nada: "hijau", simbol: "●" },
} as const satisfies Record<string, { nada: Nada; simbol: string }>;
