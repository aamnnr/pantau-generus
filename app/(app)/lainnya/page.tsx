import { ChevronRight, LogOut, Repeat } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { menuLainnya, NAV_KELOLA } from "@/components/app-shell/nav-config";
import { Halaman, JudulKelompok, Kartu, Konten, PageHeader, SkeletonDaftar } from "@/components/page";
import { Button } from "@/components/ui/button";
import { gantiMode, keluar } from "@/features/auth/actions";
import { getSession } from "@/lib/auth/session";
import { formatNoHp, inisial, LABEL_PERAN } from "@/lib/format";

export const metadata: Metadata = { title: "Lainnya · Pantau Generus" };

async function Isi() {
  const s = await getSession();
  const menuKelola = NAV_KELOLA[s.mode];
  const menuLaporan = menuLainnya(s.mode);

  return (
    <Konten>
      <Kartu className="flex items-center gap-4">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-mint text-sm font-bold text-mint-foreground">
          {inisial(s.nama)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold">{s.nama}</p>
          <p className="text-muted-foreground">
            {formatNoHp(s.noHp)} · {s.peran.map((p) => LABEL_PERAN[p]).join(", ")}
          </p>
        </div>
      </Kartu>

      {menuLaporan.length > 0 && (
        <div className="flex flex-col gap-2 lg:hidden">
          <JudulKelompok>Menu lain</JudulKelompok>
          <nav aria-label="Menu lain" className="flex flex-col gap-2">
            {menuLaporan.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex min-h-14 items-center justify-between rounded-2xl bg-card px-4 text-lg font-medium border hover:bg-mint"
              >
                {item.label}
                <ChevronRight aria-hidden className="size-6 text-muted-foreground" />
              </Link>
            ))}
          </nav>
        </div>
      )}

      {menuKelola.length > 0 && (
        <>
          <JudulKelompok>Kelola data</JudulKelompok>
          <nav aria-label="Kelola data" className="flex flex-col gap-2">
            {menuKelola.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex min-h-14 items-center justify-between rounded-2xl bg-card px-4 text-lg font-medium border hover:bg-mint"
              >
                {item.label}
                <ChevronRight aria-hidden className="size-6 text-muted-foreground" />
              </Link>
            ))}
          </nav>
        </>
      )}

      {s.peran.length > 1 && (
        <>
          <JudulKelompok>Ganti mode</JudulKelompok>
          <Kartu className="flex flex-col gap-3">
            <p className="text-muted-foreground">
              Anda memiliki beberapa peran. Mode sekarang: <strong className="text-foreground">{LABEL_PERAN[s.mode]}</strong>
            </p>
            <div className="grid grid-cols-2 gap-2">
              {s.peran
                .filter((p) => p !== s.mode)
                .map((p) => (
                  <form key={p} action={gantiMode.bind(null, p)}>
                    <Button type="submit" variant="outline" className="w-full">
                      <Repeat aria-hidden />
                      {LABEL_PERAN[p]}
                    </Button>
                  </form>
                ))}
            </div>
          </Kartu>
        </>
      )}

      <form action={keluar} className="pt-2">
        <Button type="submit" variant="outline" size="lg" className="w-full lg:w-auto">
          <LogOut aria-hidden />
          Keluar
        </Button>
      </form>
    </Konten>
  );
}

export default function LainnyaPage() {
  return (
    <Halaman lebar="form">
      <PageHeader title="Lainnya" subtitle="Akun, pengaturan, dan kelola data" />
      <Suspense fallback={<SkeletonDaftar baris={4} />}>
        <Isi />
      </Suspense>
    </Halaman>
  );
}
