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
  LayoutGrid,
  ListChecks,
  Menu,
  School,
  Target,
  UserRound,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { inisial, LABEL_PERAN, type Peran } from "@/lib/format";
import type { NavIcon, NavItem } from "./nav-config";
import { Motif } from "@/components/motif";

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

type Props = {
  utama: NavItem[];
  kelola: NavItem[];
  nama: string;
  mode: Peran;
};

export function Sidebar({ utama, kelola, nama, mode }: Props) {
  const pathname = usePathname();
  const tautan = (item: NavItem, besar: boolean) => {
    const Ikon = IKON[item.icon];
    const on = aktif(pathname, item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={on ? "page" : undefined}
        className={cn(
          "flex items-center gap-3 rounded-xl px-3.5 text-lg transition-colors",
          besar ? "h-13" : "h-12",
          on ? "bg-card font-semibold text-mint-foreground" : "text-brand-foreground hover:bg-white/12",
        )}
      >
        <Ikon aria-hidden className="size-5 shrink-0" />
        {item.label}
      </Link>
    );
  };

  return (
    <nav
      aria-label="Navigasi utama"
      className="relative hidden w-72 shrink-0 flex-col gap-1 overflow-hidden bg-brand px-4 py-7 text-brand-foreground lg:flex"
    >
      <Motif className="-bottom-20 -left-20 size-60" />
      <Link href="/beranda" className="relative mb-6 flex items-center gap-3 px-2">
        <span className="flex size-11 items-center justify-center rounded-xl bg-white/18">
          <LayoutGrid aria-hidden className="size-6" />
        </span>
        <span className="text-xl leading-tight font-bold">
          Pantau
          <br />
          Generus
        </span>
      </Link>
      <div className="relative flex flex-col gap-1">{utama.filter((i) => i.href !== "/lainnya").map((i) => tautan(i, true))}</div>
      {kelola.length > 0 && (
        <div className="relative mt-4 flex flex-col gap-1">
          <p className="px-3.5 pb-1 text-base font-semibold text-white/85">Kelola</p>
          {kelola.map((i) => tautan(i, false))}
        </div>
      )}
      <div className="flex-1" />
      <Link
        href="/lainnya"
        className="relative flex items-center gap-3 rounded-2xl bg-black/14 p-3 hover:bg-black/20"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-kunyit font-bold text-kunyit-foreground">
          {inisial(nama)}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-base font-semibold">{nama}</span>
          <span className="block text-base text-white/85">{LABEL_PERAN[mode]} · Akun</span>
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
      className="fixed inset-x-0 bottom-0 z-40 grid h-19 border-t bg-card pb-[env(safe-area-inset-bottom)] lg:hidden"
      style={{ gridTemplateColumns: `repeat(${utama.length}, minmax(0, 1fr))` }}
    >
      {utama.map((item) => {
        const Ikon = IKON[item.icon];
        const on = aktif(pathname, item.href) || (item.href === "/lainnya" && pathname.startsWith("/kelola"));
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={on ? "page" : undefined}
            className={cn(
              "flex flex-col items-center justify-center gap-1 text-base",
              on ? "font-bold text-primary" : "font-medium text-muted-foreground",
            )}
          >
            <span className={cn("flex h-8 w-14 items-center justify-center rounded-full", on && "bg-mint")}>
              <Ikon aria-hidden className="size-6" />
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
