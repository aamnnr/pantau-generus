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
        className={cn("relative overflow-hidden rounded-full bg-secondary", kecil ? "h-1.5" : "h-2")}
      >
        <div className="h-full origin-left animate-isi-bar rounded-full bg-primary" style={{ width: `${p}%` }} />
        {pk != null && pk > 0 && (
          <div aria-hidden className="absolute inset-y-0 w-0.5 bg-kunyit" style={{ left: `calc(${pk}% - 1px)` }} />
        )}
      </div>
      {pembanding && (
        <p className="text-sm text-muted-foreground">
          <span aria-hidden className="mr-1.5 inline-block h-3 w-0.5 bg-kunyit align-middle" />
          {pembanding.label}: {pk}% ({formatAngka(pembanding.nilai)} {satuan})
        </p>
      )}
    </div>
  );
}

/** Cincin progres (pola referensi "73%"): angka di tengah, busur teal yang terisi halus. */
export function CincinProgres({ nilai, ukuran = 96, tebal = 8, label, className }: {
  nilai: number | null;
  ukuran?: number;
  tebal?: number;
  label?: string;
  className?: string;
}) {
  const r = (ukuran - tebal) / 2;
  const keliling = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(100, nilai ?? 0));
  return (
    <div className={cn("relative shrink-0", className)} style={{ width: ukuran, height: ukuran }}>
      <svg width={ukuran} height={ukuran} viewBox={`0 0 ${ukuran} ${ukuran}`} className="-rotate-90" aria-hidden>
        <circle cx={ukuran / 2} cy={ukuran / 2} r={r} fill="none" stroke="var(--secondary)" strokeWidth={tebal} />
        <circle
          cx={ukuran / 2}
          cy={ukuran / 2}
          r={r}
          fill="none"
          stroke="var(--primary)"
          strokeWidth={tebal}
          strokeLinecap="round"
          strokeDasharray={keliling}
          strokeDashoffset={keliling * (1 - p / 100)}
          className="transition-[stroke-dashoffset] duration-700 ease-(--ease-halus) starting:[stroke-dashoffset:var(--awal)]"
          style={{ ["--awal" as string]: keliling }}
        />
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold tabular-nums">{nilai == null ? "—" : `${p}%`}</span>
        {label && <span className="text-xs text-muted-foreground">{label}</span>}
      </span>
    </div>
  );
}
