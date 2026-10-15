import { cn } from "@/lib/utils";

const angka = new Intl.NumberFormat("id-ID");

export function formatAngka(n: number) {
  return angka.format(n);
}

export function persen(nilai: number, total: number) {
  return total > 0 ? Math.round((100 * nilai) / total) : 0;
}

/**
 * Bar horizontal + persen + pecahan (DESIGN §6): "45% · 54 dari 120 hal.".
 * `pembanding` (mis. progres kelas) digambar sebagai garis tipis agar anak bisa dibandingkan dengan kelasnya.
 */
export function BarProgres({ nilai, total, satuan, label, pembanding, kecil, className }: {
  nilai: number;
  total: number;
  satuan: string;
  label?: React.ReactNode;
  pembanding?: { nilai: number; label: string };
  kecil?: boolean;
  className?: string;
}) {
  const p = persen(nilai, total);
  const pk = pembanding ? persen(pembanding.nilai, total) : null;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        {label && <span className="font-medium">{label}</span>}
        <span className={cn("tabular-nums", !label && "w-full")}>
          <strong className={kecil ? "text-base" : "text-xl"}>{p}%</strong>
          <span className="text-muted-foreground">
            {" · "}
            {formatAngka(nilai)} dari {formatAngka(total)} {satuan}
          </span>
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={p}
        aria-label={typeof label === "string" ? label : undefined}
        className={cn("relative overflow-hidden rounded-full bg-secondary", kecil ? "h-2.5" : "h-3.5")}
      >
        <div className="h-full rounded-full bg-primary" style={{ width: `${p}%` }} />
        {pk != null && pk > 0 && (
          <div aria-hidden className="absolute inset-y-0 w-0.5 bg-kunyit" style={{ left: `calc(${pk}% - 1px)` }} />
        )}
      </div>
      {pembanding && (
        <p className="text-base text-muted-foreground">
          <span aria-hidden className="mr-1.5 inline-block h-3 w-0.5 bg-kunyit align-middle" />
          {pembanding.label}: {pk}% ({formatAngka(pembanding.nilai)} {satuan})
        </p>
      )}
    </div>
  );
}
