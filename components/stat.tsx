import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const NADA = {
  teal: "bg-mint text-primary",
  oranye: "bg-warn-soft text-kunyit",
  biru: "bg-info-soft text-info",
  abu: "bg-secondary text-teks-2",
  merah: "bg-bahaya-soft text-bahaya",
} as const;

/** Kotak angka ringkas (pola referensi "8 Completed"): ikon bulat berwarna + angka + label. */
export function KotakAngka({ ikon: Ikon, nilai, label, nada = "teal", className }: {
  ikon: LucideIcon;
  nilai: React.ReactNode;
  label: string;
  nada?: keyof typeof NADA;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3 rounded-2xl border bg-card p-3.5", className)}>
      <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-full", NADA[nada])}>
        <Ikon aria-hidden className="size-5" />
      </span>
      <span className="min-w-0">
        <span className="block text-xl leading-tight font-bold tabular-nums">{nilai}</span>
        <span className="block truncate text-sm text-muted-foreground">{label}</span>
      </span>
    </div>
  );
}
