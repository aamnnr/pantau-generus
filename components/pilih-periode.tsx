import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { hrefDengan, JENIS_PERIODE, type Periode } from "@/lib/periode";
import { cn } from "@/lib/utils";

/**
 * Pilihan periode lewat tautan (tanpa JavaScript): segmen jenis + navigasi sebelum/sesudah.
 * `tetap` = parameter lain yang ikut terbawa (mis. kelas yang sedang dilihat).
 */
export function PilihPeriode({ base, periode, tetap }: { base: string; periode: Periode; tetap?: Record<string, string | undefined> }) {
  const panah = "flex size-10 shrink-0 items-center justify-center rounded-lg border bg-card text-teks-2 transition-colors hover:bg-muted active:scale-95";
  return (
    <div className="flex flex-col gap-2">
      <nav aria-label="Jenis periode" className="grid grid-cols-4 gap-1 rounded-xl bg-secondary p-1">
        {JENIS_PERIODE.map((j) => (
          <Link
            key={j.value}
            href={hrefDengan(base, tetap, { periode: j.value })}
            aria-current={periode.jenis === j.value ? "page" : undefined}
            className={cn(
              "flex h-10 items-center justify-center rounded-lg text-base font-medium text-muted-foreground transition-colors",
              periode.jenis === j.value && "bg-card font-semibold text-primary shadow-[0_1px_3px_rgba(20,22,22,0.12)]",
            )}
          >
            {j.label}
          </Link>
        ))}
      </nav>
      <div className="flex items-center gap-2">
        {periode.sebelum ? (
          <Link href={hrefDengan(base, tetap, periode.sebelum)} className={panah} aria-label="Periode sebelumnya">
            <ChevronLeft aria-hidden className="size-5" />
          </Link>
        ) : (
          periode.jenis !== "semua" && <span className="size-10 shrink-0" />
        )}
        <p className="flex-1 text-center text-base font-semibold" aria-live="polite">
          {periode.label}
        </p>
        {periode.sesudah ? (
          <Link href={hrefDengan(base, tetap, periode.sesudah)} className={panah} aria-label="Periode sesudahnya">
            <ChevronRight aria-hidden className="size-5" />
          </Link>
        ) : (
          periode.jenis !== "semua" && <span className="size-10 shrink-0" />
        )}
      </div>
    </div>
  );
}
