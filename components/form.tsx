"use client";

import { AlertCircle, Check, Loader2 } from "lucide-react";
import { useState, useSyncExternalStore } from "react";
import { useFormStatus } from "react-dom";
import { IndikatorGeser } from "@/components/indikator-geser";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/** Label di atas isian + pesan galat (DESIGN §9: semua input punya label terlihat). */
export function Field({ label, htmlFor, error, hint, children, className }: {
  label: React.ReactNode;
  htmlFor?: string;
  error?: string[];
  hint?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {/* block: label berisi teks + keterangan "(opsional)" harus mengalir sebagai satu kalimat */}
      <Label htmlFor={htmlFor} className="block">
        {label}
      </Label>
      {children}
      {hint && !error?.length && <p className="text-sm text-muted-foreground">{hint}</p>}
      {error?.map((e) => (
        <p key={e} className="flex animate-muncul items-center gap-1.5 text-sm font-medium text-destructive">
          <AlertCircle aria-hidden className="size-4 shrink-0" />
          {e}
        </p>
      ))}
    </div>
  );
}

type Opsi = { value: string; label: React.ReactNode };

/**
 * Tombol segmen untuk ≤ 5 pilihan (CLAUDE.md, Aturan UI). Memakai radio asli agar
 * bekerja dengan FormData dan keyboard tanpa JavaScript tambahan.
 */
export function Segmen({ name, legend, options, defaultValue, error }: {
  name: string;
  legend: React.ReactNode;
  options: Opsi[];
  defaultValue?: string;
  error?: string[];
}) {
  // Nilai terpilih dilacak hanya untuk menggeser latar; nilai yang terkirim tetap dari radio asli.
  const [dipilih, setDipilih] = useState(defaultValue);
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1.5 text-base font-semibold">{legend}</legend>
      <div
        className="relative grid gap-1 rounded-xl bg-secondary p-1"
        style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      >
        <IndikatorGeser indeks={options.findIndex((o) => o.value === dipilih)} jumlah={options.length} />
        {options.map((o) => (
          <label key={o.value} className="relative z-10 cursor-pointer">
            <input
              type="radio"
              name={name}
              value={o.value}
              defaultChecked={defaultValue === o.value}
              onChange={() => setDipilih(o.value)}
              className="peer sr-only"
            />
            <span className="flex min-h-10 items-center justify-center rounded-lg px-2 text-center text-base leading-tight font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground peer-checked:font-semibold peer-checked:text-primary peer-focus-visible:ring-3 peer-focus-visible:ring-ring/40">
              {o.label}
            </span>
          </label>
        ))}
      </div>
      {error?.map((e) => (
        <p key={e} className="font-medium text-destructive">
          {e}
        </p>
      ))}
    </fieldset>
  );
}

type OpsiKartu = { value: string; label: React.ReactNode; sub?: React.ReactNode };

/** Kartu pilihan (radio/checkbox) untuk pilihan > 5, mis. kelas atau peran. */
export function PilihanKartu({ name, type = "radio", options, defaultValue = [], kolom = 3, className }: {
  name: string;
  type?: "radio" | "checkbox";
  options: OpsiKartu[];
  defaultValue?: string[];
  kolom?: 2 | 3 | 4;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid gap-2",
        kolom === 2 && "grid-cols-2",
        kolom === 3 && "grid-cols-2 sm:grid-cols-3",
        kolom === 4 && "grid-cols-4",
        className,
      )}
    >
      {options.map((o) => (
        <label key={o.value} className="relative cursor-pointer">
          <input
            type={type}
            name={name}
            value={o.value}
            defaultChecked={defaultValue.includes(o.value)}
            className="peer sr-only"
          />
          <span className="flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-input bg-card px-2 py-2 text-center text-base leading-tight font-medium transition-[background-color,border-color,color] duration-150 hover:border-primary/40 peer-checked:border-primary peer-checked:bg-mint peer-checked:font-semibold peer-checked:text-mint-foreground peer-focus-visible:ring-3 peer-focus-visible:ring-ring/40 [&>svg]:hidden peer-checked:[&>svg]:block peer-checked:[&>svg]:animate-pop">
            <Check aria-hidden className="size-4 shrink-0" />
            <span className="flex flex-col">
              {o.label}
              {o.sub && <span className="text-sm font-normal text-muted-foreground">{o.sub}</span>}
            </span>
          </span>
        </label>
      ))}
    </div>
  );
}

// Store "sudah terhidrasi": snapshot server false, klien true. Panggil sekali setelah
// berlangganan agar React pasti membandingkan ulang dan beralih ke snapshot klien.
const berlangganan = (ubah: () => void) => {
  queueMicrotask(ubah);
  return () => {};
};

export function SubmitButton({ children, pendingLabel = "Menyimpan…", className, disabled, ...props }: React.ComponentProps<typeof Button> & {
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();
  // Kunci sampai terhidrasi: kirim sebelum JS siap (HP lambat) jatuh ke POST biasa
  // dan memicu galat cookies Next.js, juga membuang state form.
  const siap = useSyncExternalStore(berlangganan, () => true, () => false);
  return (
    <Button type="submit" size="lg" disabled={pending || !siap || disabled} aria-busy={pending} className={cn("w-full lg:w-auto lg:min-w-40", className)} {...props}>
      {pending ? (
        <>
          <Loader2 aria-hidden className="animate-spin" />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </Button>
  );
}

export function FormError({ error }: { error?: string }) {
  if (!error) return null;
  return (
    <p role="alert" className="flex animate-muncul items-start gap-2 rounded-xl border border-bahaya-line bg-bahaya-soft px-3.5 py-3 text-base font-medium text-bahaya">
      <AlertCircle aria-hidden className="mt-0.5 size-[18px] shrink-0" />
      {error}
    </p>
  );
}

/** Tombol simpan menempel di bawah layar di HP (di atas bottom nav), biasa di desktop (DESIGN §5.1). */
export function AksiBawah({ children }: { children: React.ReactNode }) {
  return (
    <div className="sticky bottom-16 z-30 -mx-4 flex flex-col gap-2 border-t bg-card/95 px-4 py-3 backdrop-blur-md lg:static lg:mx-0 lg:flex-row lg:justify-end lg:border-0 lg:bg-transparent lg:p-0">
      {children}
    </div>
  );
}
