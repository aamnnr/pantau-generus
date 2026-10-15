"use client";

import {
  BookOpenText,
  CalendarDays,
  ChartColumn,
  ClipboardList,
  FileText,
  History,
  House,
  KeyRound,
  ListChecks,
  Menu,
  School,
  Target,
  UserRound,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/logo";
import { inisial, LABEL_PERAN, type Peran } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { NavIcon, NavItem } from "./nav-config";

const IKON: Record<NavIcon, LucideIcon> = {
  kalender: CalendarDays,
  anak: UsersRound,
  target: Target,
  menu: Menu,
  beranda: House,
  riwayat: History,
  raport: FileText,
  rekap: ChartColumn,
  kelas: School,
  guru: UserRound,
  akun: KeyRound,
  kitab: BookOpenText,
  materi: ListChecks,
  tilawati: ClipboardList,
};

function aktif(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Ikon menu yang berdenyut selama halaman tujuan dimuat — umpan balik di HP lambat. */
function IkonMenu({ ikon: Ikon, className }: { ikon: LucideIcon; className?: string }) {
  const { pending } = useLinkStatus();
  return <Ikon aria-hidden className={cn(className, pending && "animate-pulse opacity-60")} />;
}

type Props = {
  utama: NavItem[];
  kelola: NavItem[];
  nama: string;
  mode: Peran;
};

export function Sidebar({ utama, kelola, nama, mode }: Props) {
  const pathname = usePathname();
  const tautan = (item: NavItem) => {
    const on = aktif(pathname, item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={on ? "page" : undefined}
        className={cn(
          "group flex h-10 shrink-0 items-center gap-3 rounded-lg px-3 text-base transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
          on ? "bg-mint font-semibold text-mint-foreground" : "font-medium text-teks-2 hover:bg-muted hover:text-foreground",
        )}
      >
        <IkonMenu ikon={IKON[item.icon]} className={cn("size-[18px] shrink-0", on ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
        {item.label}
      </Link>
    );
  };

  return (
    <nav aria-label="Navigasi utama" className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-3 border-r bg-card px-4 py-6 lg:flex">
      <Link href="/beranda" className="mb-3 shrink-0 rounded-lg px-1 outline-none focus-visible:ring-2 focus-visible:ring-ring/60">
        <Logo />
      </Link>
      {/* Menu bisa digulir sendiri agar kartu profil di bawah tidak terpotong pada layar pendek. */}
      <div className="-mx-1 flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-1 [scrollbar-width:thin]">
        <p className="px-3 pb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Menu</p>
        {utama.filter((i) => i.href !== "/lainnya").map(tautan)}
        {kelola.length > 0 && (
          <>
            <p className="mt-4 px-3 pb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Kelola</p>
            {kelola.map(tautan)}
          </>
        )}
      </div>
      <Link
        href="/lainnya"
        aria-current={aktif(pathname, "/lainnya") ? "page" : undefined}
        className="flex shrink-0 items-center gap-3 rounded-xl border p-2.5 transition-colors outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/60 aria-[current=page]:border-primary/30 aria-[current=page]:bg-mint"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-mint text-sm font-bold text-mint-foreground">
          {inisial(nama)}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-base font-semibold">{nama}</span>
          <span className="block text-sm text-muted-foreground">{LABEL_PERAN[mode]}</span>
        </span>
      </Link>
    </nav>
  );
}

export function BottomNav({ utama }: Pick<Props, "utama">) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Navigasi utama"
      className="fixed inset-x-0 bottom-0 z-40 grid border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
      style={{ gridTemplateColumns: `repeat(${utama.length}, minmax(0, 1fr))` }}
    >
      {utama.map((item) => {
        const on = aktif(pathname, item.href) || (item.href === "/lainnya" && pathname.startsWith("/kelola"));
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={on ? "page" : undefined}
            className={cn(
              "relative flex h-16 flex-col items-center justify-center gap-1 text-sm transition-colors outline-none focus-visible:bg-mint",
              on ? "font-semibold text-primary" : "font-medium text-muted-foreground",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "absolute top-0 h-[3px] w-8 rounded-b-full bg-primary transition-transform duration-200 ease-(--ease-halus)",
                on ? "scale-x-100" : "scale-x-0",
              )}
            />
            <IkonMenu ikon={IKON[item.icon]} className="size-[22px]" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
