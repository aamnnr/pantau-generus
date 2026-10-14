import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Motif } from "@/components/motif";
import { cn } from "@/lib/utils";

/** Wadah halaman. `form` = maks 768px (DESIGN §4), `lebar` = maks 1200px untuk tabel/rekap. */
export function Halaman({ children, lebar = "lebar" }: { children: React.ReactNode; lebar?: "form" | "lebar" }) {
  return (
    <main className={cn("mx-auto flex w-full flex-col gap-5 lg:px-10 lg:py-8", lebar === "form" ? "max-w-3xl" : "max-w-6xl")}>
      {children}
    </main>
  );
}

type HeaderProps = {
  title: string;
  subtitle?: React.ReactNode;
  back?: { href: string; label?: string };
  actions?: React.ReactNode;
  children?: React.ReactNode;
};

/**
 * HP: blok hijau bermotif (mockup "Generus — daftar"). Desktop: judul polos, karena sidebar sudah hijau.
 * Halaman formulir memakai <FormHeader> yang lebih tenang.
 */
export function PageHeader({ title, subtitle, back, actions, children }: HeaderProps) {
  return (
    <header className="relative overflow-hidden rounded-b-[28px] bg-brand px-4 pt-6 pb-5 text-brand-foreground lg:rounded-none lg:bg-transparent lg:p-0 lg:text-foreground">
      <Motif className="-top-14 -right-14 size-52 lg:hidden" />
      <div className="relative flex flex-col gap-4">
        {back && <BackLink {...back} className="text-brand-foreground lg:text-primary" />}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold">{title}</h1>
            {subtitle && <p className="mt-0.5 text-base lg:text-muted-foreground">{subtitle}</p>}
          </div>
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>
        {children}
      </div>
    </header>
  );
}

export function FormHeader({ title, subtitle, back }: Omit<HeaderProps, "actions" | "children">) {
  return (
    <header className="flex flex-col gap-2 border-b bg-card px-2 pt-3 pb-4 lg:border-0 lg:bg-transparent lg:p-0">
      {back && <BackLink {...back} className="text-primary" />}
      <div className="px-2 lg:px-0">
        <h1 className="text-2xl font-bold">{title}</h1>
        {subtitle && <p className="mt-0.5 text-muted-foreground">{subtitle}</p>}
      </div>
    </header>
  );
}

export function BackLink({ href, label = "Kembali", className }: { href: string; label?: string; className?: string }) {
  return (
    <Link
      href={href}
      className={cn("inline-flex h-12 w-fit items-center gap-1 rounded-xl px-2 text-lg font-semibold -ml-2", className)}
    >
      <ChevronLeft aria-hidden className="size-6" />
      {label}
    </Link>
  );
}

/** Isi halaman di bawah header: padding 16px di HP (DESIGN §4). */
export function Konten({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex flex-col gap-4 px-4 lg:px-0", className)}>{children}</div>;
}

export function Kartu({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("rounded-2xl bg-card p-4 shadow-[0_1px_2px_rgba(18,20,19,0.06)] lg:p-6", className)}>{children}</div>;
}

export function Kosong({ judul, keterangan, aksi }: { judul: string; keterangan?: string; aksi?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-input bg-card px-6 py-10 text-center">
      <p className="text-lg font-semibold">{judul}</p>
      {keterangan && <p className="max-w-md text-muted-foreground">{keterangan}</p>}
      {aksi}
    </div>
  );
}

export function SkeletonDaftar({ baris = 5 }: { baris?: number }) {
  return (
    <div className="flex flex-col gap-2.5 px-4 lg:px-0" aria-busy="true" aria-label="Memuat">
      {Array.from({ length: baris }, (_, i) => (
        <div key={i} className="h-19 animate-pulse rounded-2xl bg-card" />
      ))}
    </div>
  );
}

/** Judul kelompok dalam daftar, mis. per jenjang. */
export function JudulKelompok({ children }: { children: React.ReactNode }) {
  return <h2 className="pt-2 text-lg font-semibold text-muted-foreground">{children}</h2>;
}
