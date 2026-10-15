"use client";

import { CalendarDays, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { geserTanggal } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Navigasi tanggal Hari Ini: ‹ tanggal › + kalender. Memilih tanggal langsung membuka harinya
 * (tanpa tombol "Buka"), dengan indikator memuat selama halaman berganti.
 */
export function PilihTanggal({ tanggal, hari, label }: { tanggal: string; hari: string; label: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const buka = (t: string) => start(() => router.push(t === hari ? "/hari-ini" : `/hari-ini?tanggal=${t}`));
  const panah = "flex size-10 shrink-0 items-center justify-center rounded-lg text-teks-2 transition-colors hover:bg-muted active:scale-95";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-0.5 rounded-xl border bg-card p-0.5">
        <Link href={`/hari-ini?tanggal=${geserTanggal(tanggal, -1)}`} className={panah} aria-label="Hari sebelumnya">
          <ChevronLeft aria-hidden className="size-5" />
        </Link>
        <label className="relative flex h-10 cursor-pointer items-center gap-2 rounded-lg px-2.5 text-base font-semibold transition-colors hover:bg-muted">
          {pending ? <Loader2 aria-hidden className="size-[18px] animate-spin text-primary" /> : <CalendarDays aria-hidden className="size-[18px] text-primary" />}
          <span>{label}</span>
          <input
            type="date"
            value={tanggal}
            onChange={(e) => e.target.value && buka(e.target.value)}
            aria-label="Pilih tanggal"
            className="absolute inset-0 cursor-pointer opacity-0 [color-scheme:light]"
          />
        </label>
        <Link href={`/hari-ini?tanggal=${geserTanggal(tanggal, 1)}`} className={panah} aria-label="Hari berikutnya">
          <ChevronRight aria-hidden className="size-5" />
        </Link>
      </div>
      <Link
        href="/hari-ini"
        aria-disabled={tanggal === hari}
        className={cn(
          "flex h-10 items-center rounded-xl border bg-card px-3.5 text-base font-semibold transition-colors hover:bg-muted",
          tanggal === hari && "pointer-events-none border-primary/30 bg-mint text-mint-foreground",
        )}
      >
        Hari ini
      </Link>
    </div>
  );
}
