import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { hrefDengan, JENIS_PERIODE, type Periode } from "@/lib/periode";
import { cn } from "@/lib/utils";

/**
 * Pilihan periode lewat tautan (tanpa JavaScript): segmen jenis + navigasi sebelum/sesudah.
 * `tetap` = parameter lain yang ikut terbawa (mis. kelas yang sedang dilihat).
 */
export function PilihPeriode({ base, periode, tetap }: { base: string; periode: Periode; tetap?: Record<string, string | undefined> }) {
  const panah = "flex size-12 shrink-0 items-center justify-center rounded-xl bg-card text-primary shadow-sm hover:bg-mint";
  return (
    <div className="flex flex-col gap-2">
      <nav aria-label="Jenis periode" className="grid grid-cols-4 gap-1 rounded-2xl bg-secondary p-1">
        {JENIS_PERIODE.map((j) => (
          <Link
            key={j.value}
            href={hrefDengan(base, tetap, { periode: j.value })}
            aria-current={periode.jenis === j.value ? "page" : undefined}
            className={cn(
              "flex h-12 items-center justify-center rounded-xl text-base font-medium text-[#444444]",
              periode.jenis === j.value && "bg-card font-semibold text-primary shadow-sm",
            )}
          >
            {j.label}
          </Link>
        ))}
      </nav>
      <div className="flex items-center gap-2">
        {periode.sebelum ? (
          <Link href={hrefDengan(base, tetap, periode.sebelum)} className={panah} aria-label="Periode sebelumnya">
            <ChevronLeft aria-hidden className="size-6" />
          </Link>
        ) : (
          periode.jenis !== "semua" && <span className="size-12 shrink-0" />
        )}
        <p className="flex-1 text-center text-lg font-semibold" aria-live="polite">
          {periode.label}
        </p>
        {periode.sesudah ? (
          <Link href={hrefDengan(base, tetap, periode.sesudah)} className={panah} aria-label="Periode sesudahnya">
            <ChevronRight aria-hidden className="size-6" />
          </Link>
        ) : (
          periode.jenis !== "semua" && <span className="size-12 shrink-0" />
        )}
      </div>
    </div>
  );
}
