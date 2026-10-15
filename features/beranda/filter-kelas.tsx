import Link from "next/link";
import { IndikatorGeser } from "@/components/indikator-geser";
import { LABEL_JENJANG, URUTAN_JENJANG, type Jenjang } from "@/lib/format";
import { hrefDengan } from "@/lib/periode";
import { cn } from "@/lib/utils";

type Kelas = { id: string; nama: string; jenjang: Jenjang };
export type FilterKelas = { jenjang?: Jenjang; kelas?: Kelas };

/** Baca ?jenjang=&kelas= dan cocokkan dengan kelas yang boleh dilihat pengguna. */
export function bacaFilterKelas(cari: { jenjang?: string; kelas?: string }, kelas: Kelas[]): FilterKelas & { kelasIds: string[] | null } {
  const k = kelas.find((x) => x.id === cari.kelas);
  const jenjang = k?.jenjang ?? URUTAN_JENJANG.find((j) => j === cari.jenjang && kelas.some((x) => x.jenjang === j));
  return {
    jenjang,
    kelas: k,
    kelasIds: k ? [k.id] : jenjang ? kelas.filter((x) => x.jenjang === jenjang).map((x) => x.id) : null,
  };
}

/**
 * Filter jenjang → kelas lewat tautan (tanpa JavaScript, posisi gulir tetap).
 * Baris kedua muncul bila jenjang terpilih punya lebih dari satu kelas (Caberawit TK–3B, Remaja SLTA/mandiri).
 */
export function PilihKelasFilter({ base, kelas, filter }: { base: string; kelas: Kelas[]; filter: FilterKelas }) {
  const jenjangAda = URUTAN_JENJANG.filter((j) => kelas.some((k) => k.jenjang === j));
  if (kelas.length <= 1) return null;
  const opsi: { id?: Jenjang; label: string }[] = [{ label: "Semua" }, ...jenjangAda.map((j) => ({ id: j, label: LABEL_JENJANG[j] }))];
  const indeks = opsi.findIndex((o) => o.id === filter.jenjang);
  const sub = filter.jenjang ? kelas.filter((k) => k.jenjang === filter.jenjang) : [];

  return (
    <div className="flex flex-col gap-2">
      {jenjangAda.length > 1 && (
        <nav
          aria-label="Saring jenjang"
          className="relative grid gap-1 rounded-xl bg-secondary p-1"
          style={{ gridTemplateColumns: `repeat(${opsi.length}, minmax(0, 1fr))` }}
        >
          <IndikatorGeser indeks={indeks} jumlah={opsi.length} />
          {opsi.map((o) => (
            <Link
              key={o.label}
              href={hrefDengan(base, { jenjang: o.id })}
              scroll={false}
              aria-current={filter.jenjang === o.id && !(o.id === undefined && filter.kelas) ? "page" : undefined}
              className={cn(
                "relative z-10 flex h-9 items-center justify-center truncate rounded-lg px-1 text-sm font-medium text-muted-foreground hover:text-foreground",
                filter.jenjang === o.id && "font-semibold text-primary hover:text-primary",
              )}
            >
              {o.label}
            </Link>
          ))}
        </nav>
      )}
      {sub.length > 1 && (
        <nav aria-label="Saring kelas" className="-mx-1 flex animate-muncul gap-1.5 overflow-x-auto px-1 pb-0.5">
          {[{ id: undefined as string | undefined, nama: `Semua ${LABEL_JENJANG[filter.jenjang!]}` }, ...sub].map((k) => {
            const aktif = (filter.kelas?.id ?? undefined) === k.id;
            return (
              <Link
                key={k.id ?? "semua"}
                href={hrefDengan(base, { jenjang: filter.jenjang, kelas: k.id })}
                scroll={false}
                aria-current={aktif ? "page" : undefined}
                className={cn(
                  "flex h-8 shrink-0 items-center rounded-full border px-3 text-sm font-medium whitespace-nowrap",
                  aktif ? "border-primary/40 bg-mint font-semibold text-mint-foreground" : "bg-card text-teks-2 hover:bg-muted",
                )}
              >
                {k.nama}
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
