import { ChevronLeft, Inbox, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/** Wadah halaman. `form` = maks 720px (DESIGN §4), `lebar` = maks 1200px untuk tabel/rekap. Isi muncul halus. */
export function Halaman({ children, lebar = "lebar" }: { children: React.ReactNode; lebar?: "form" | "lebar" }) {
  return (
    <main
      className={cn(
        "mx-auto flex w-full animate-muncul flex-col gap-4 lg:gap-5 lg:px-8 lg:py-7 print:max-w-none print:animate-none print:p-0",
        lebar === "form" ? "max-w-3xl" : "max-w-6xl",
      )}
    >
      {children}
    </main>
  );
}

type HeaderProps = {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  back?: { href: string; label?: string };
  actions?: React.ReactNode;
  children?: React.ReactNode;
};

/** Judul halaman polos di atas latar abu (referensi DESIGN §5): tenang, tanpa blok warna. */
export function PageHeader({ title, subtitle, back, actions, children }: HeaderProps) {
  return (
    <header className="flex flex-col gap-3 px-4 pt-5 lg:px-0 lg:pt-0">
      {back && <BackLink {...back} />}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">{title}</h1>
          {subtitle && <p className="mt-0.5 text-base text-muted-foreground">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
      {children}
    </header>
  );
}

export function FormHeader({ title, subtitle, back }: Omit<HeaderProps, "actions" | "children">) {
  return (
    <header className="flex flex-col gap-1 px-4 pt-4 lg:px-0 lg:pt-0">
      {back && <BackLink {...back} />}
      <h1 className="text-2xl font-bold">{title}</h1>
      {subtitle && <p className="text-base text-muted-foreground">{subtitle}</p>}
    </header>
  );
}

export function BackLink({ href, label = "Kembali", className }: { href: string; label?: string; className?: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "-ml-1.5 inline-flex h-10 w-fit items-center gap-0.5 rounded-lg pr-2.5 pl-1 text-base font-semibold text-primary transition-colors hover:bg-mint",
        className,
      )}
    >
      <ChevronLeft aria-hidden className="size-5" />
      {label}
    </Link>
  );
}

/** Isi halaman di bawah header: padding 16px di HP (DESIGN §4). */
export function Konten({ children, className }: { children: React.ReactNode; className?: string }) {
  // Isi yang datang belakangan (Suspense) ikut muncul halus, tidak tiba-tiba menggantikan kerangka.
  return <div className={cn("flex animate-muncul flex-col gap-4 px-4 lg:px-0", className)}>{children}</div>;
}

export function Kartu({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("rounded-2xl border bg-card p-4 lg:p-5", className)}>{children}</div>;
}

/** Judul kartu + aksi kecil di kanan (pola referensi: "Activity · This week"). */
export function JudulKartu({ children, aksi, className }: { children: React.ReactNode; aksi?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-2", className)}>
      <h2 className="text-lg font-semibold">{children}</h2>
      {aksi}
    </div>
  );
}

export function Kosong({ judul, keterangan, aksi, ikon: Ikon = Inbox }: { judul: string; keterangan?: string; aksi?: React.ReactNode; ikon?: LucideIcon }) {
  return (
    <div className="flex animate-muncul flex-col items-center gap-2 rounded-2xl border border-dashed border-input bg-card px-6 py-10 text-center">
      <span className="mb-1 flex size-10 items-center justify-center rounded-full bg-mint text-primary">
        <Ikon aria-hidden className="size-6" />
      </span>
      <p className="text-lg font-semibold">{judul}</p>
      {keterangan && <p className="max-w-md text-base text-muted-foreground">{keterangan}</p>}
      {aksi && <div className="mt-2">{aksi}</div>}
    </div>
  );
}

/** Kerangka memuat dengan kilau berjalan (bukan spinner kosong, DESIGN §6). */
export function Kerangka({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-kilau rounded-2xl bg-[linear-gradient(90deg,var(--secondary)_25%,#f8fafa_50%,var(--secondary)_75%)] bg-size-[200%_100%]",
        className,
      )}
    />
  );
}

export function SkeletonDaftar({ baris = 5 }: { baris?: number }) {
  return (
    <div className="flex flex-col gap-2.5 px-4 lg:px-0" aria-busy="true" aria-label="Memuat">
      {Array.from({ length: baris }, (_, i) => (
        <Kerangka key={i} className="h-16" />
      ))}
    </div>
  );
}

/** Judul kelompok dalam daftar, mis. per jenjang. */
export function JudulKelompok({ children }: { children: React.ReactNode }) {
  return <h2 className="pt-1 text-base font-semibold text-teks-2">{children}</h2>;
}
