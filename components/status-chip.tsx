import { cn } from "@/lib/utils";

const NADA = {
  hijau: "bg-[#e3f4e9] text-[#0b5f31]",
  kunyit: "bg-[#fff1de] text-[#8a4b00]",
  biru: "bg-[#e4eefb] text-[#1f4e8c]",
  ungu: "bg-[#f0e7f8] text-[#5e2a86]",
  merah: "bg-[#fdecec] text-[#a61b1b]",
  abu: "bg-muted text-[#444444]",
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
    <span className={cn("inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-base font-semibold", NADA[nada], className)}>
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
