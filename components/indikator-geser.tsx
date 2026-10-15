import { cn } from "@/lib/utils";

/**
 * Latar pilihan yang bergeser halus di antara tombol segmen (DESIGN §11), bukan melompat.
 * Wadah: `relative grid gap-1 p-1` dengan `jumlah` kolom sama lebar; isi tombol diberi `relative z-10`.
 */
export function IndikatorGeser({ indeks, jumlah, className }: { indeks: number; jumlah: number; className?: string }) {
  if (indeks < 0) return null;
  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute top-1 bottom-1 left-1 rounded-lg bg-card shadow-[0_1px_3px_rgba(20,22,22,0.12)] transition-transform duration-300 ease-(--ease-halus)",
        className,
      )}
      style={{
        width: `calc((100% - 0.5rem - ${jumlah - 1} * 0.25rem) / ${jumlah})`,
        transform: `translateX(calc(${indeks} * (100% + 0.25rem)))`,
      }}
    />
  );
}
