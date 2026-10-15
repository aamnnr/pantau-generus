"use client";

import { Check } from "lucide-react";
import { useSyncExternalStore } from "react";
import { useFormStatus } from "react-dom";
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
    <div className={cn("flex flex-col gap-2", className)}>
      {/* block: label berisi teks + keterangan "(opsional)" harus mengalir sebagai satu kalimat */}
      <Label htmlFor={htmlFor} className="block">
        {label}
      </Label>
      {children}
      {hint && !error?.length && <p className="text-muted-foreground">{hint}</p>}
      {error?.map((e) => (
        <p key={e} className="font-medium text-destructive">
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
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-base font-semibold">{legend}</legend>
      <div
        className="grid gap-1 rounded-2xl bg-secondary p-1"
        style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      >
        {options.map((o) => (
          <label key={o.value} className="relative cursor-pointer">
            <input
              type="radio"
              name={name}
              value={o.value}
              defaultChecked={defaultValue === o.value}
              className="peer sr-only"
            />
            <span className="flex min-h-12 items-center justify-center rounded-xl px-2 text-center text-base leading-tight font-medium text-[#444444] peer-checked:bg-card peer-checked:font-semibold peer-checked:text-primary peer-checked:shadow-sm peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50">
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
          <span className="flex min-h-13 items-center justify-center gap-1.5 rounded-xl border-[1.5px] border-input bg-card px-2 py-2 text-center text-base leading-tight font-semibold peer-checked:border-2 peer-checked:border-primary peer-checked:bg-mint peer-checked:text-mint-foreground peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50 [&>svg]:hidden peer-checked:[&>svg]:block">
            <Check aria-hidden className="size-5 shrink-0" />
            <span className="flex flex-col">
              {o.label}
              {o.sub && <span className="text-base font-normal text-muted-foreground">{o.sub}</span>}
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
    <Button type="submit" size="lg" disabled={pending || !siap || disabled} className={cn("w-full lg:w-auto lg:min-w-48", className)} {...props}>
      {pending ? pendingLabel : children}
    </Button>
  );
}

export function FormError({ error }: { error?: string }) {
  if (!error) return null;
  return (
    <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 font-medium text-destructive">
      {error}
    </p>
  );
}

/** Tombol simpan menempel di bawah layar di HP (di atas bottom nav), biasa di desktop (DESIGN §5.1). */
export function AksiBawah({ children }: { children: React.ReactNode }) {
  return (
    <div className="sticky bottom-19 z-30 -mx-4 flex flex-col gap-2 border-t bg-card px-4 py-3 lg:static lg:mx-0 lg:flex-row lg:justify-end lg:border-0 lg:bg-transparent lg:p-0">
      {children}
    </div>
  );
}
