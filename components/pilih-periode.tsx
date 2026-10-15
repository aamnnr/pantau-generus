import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { IndikatorGeser } from "@/components/indikator-geser";
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
      <nav aria-label="Jenis periode" className="relative grid grid-cols-4 gap-1 rounded-xl bg-secondary p-1">
        <IndikatorGeser indeks={JENIS_PERIODE.findIndex((j) => j.value === periode.jenis)} jumlah={JENIS_PERIODE.length} />
        {JENIS_PERIODE.map((j) => (
          <Link
            key={j.value}
            href={hrefDengan(base, tetap, { periode: j.value })}
            aria-current={periode.jenis === j.value ? "page" : undefined}
            className={cn(
              "relative z-10 flex h-10 items-center justify-center rounded-lg text-base font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground",
              periode.jenis === j.value && "font-semibold text-primary hover:text-primary",
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
      {periode.kosong && (
        <p className="rounded-lg border border-info/20 bg-info-soft px-3 py-2 text-sm text-info">
          Belum ada periode target. Buat target di menu <Link href="/target" className="font-semibold underline underline-offset-2">Target</Link> terlebih dulu, atau pilih Bulan/Semester.
        </p>
      )}
    </div>
  );
}
