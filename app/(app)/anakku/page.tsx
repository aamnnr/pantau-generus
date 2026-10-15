import { ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Halaman, Konten, Kosong, PageHeader, SkeletonDaftar } from "@/components/page";
import { CHIP_STATUS_GENERUS, StatusChip } from "@/components/status-chip";
import { daftarAnakku } from "@/features/progres/queries";
import { requirePeran } from "@/lib/auth/session";
import { inisial, LABEL_STATUS_GENERUS, labelKelas } from "@/lib/format";

export const metadata: Metadata = { title: "Anakku · Pantau Generus" };

async function Daftar() {
  const session = await requirePeran("wali");
  const anak = await daftarAnakku(session.userId);
  if (anak.length === 0) {
    return (
      <Konten>
        <Kosong judul="Belum ada anak yang terhubung" keterangan="Hubungi admin kelompok agar akun Anda dihubungkan dengan data anak." />
      </Konten>
    );
  }
  return (
    <Konten>
      <ul className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
        {anak.map((g) => (
          <li key={g.id}>
            <Link
              href={`/generus/${g.id}`}
              className="flex min-h-19 items-center gap-3.5 rounded-2xl bg-card px-3.5 py-3 shadow-[0_1px_2px_rgba(18,20,19,0.06)] hover:bg-mint/60"
            >
              <span aria-hidden className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-mint text-lg font-bold text-mint-foreground">
                {inisial(g.nama)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-lg font-medium">{g.nama}</span>
                <span className="block text-muted-foreground">{g.kelas ? labelKelas(g.kelas) : "Tanpa kelas"}</span>
              </span>
              {g.status !== "aktif" && (
                <StatusChip nada={CHIP_STATUS_GENERUS[g.status].nada} simbol={CHIP_STATUS_GENERUS[g.status].simbol}>
                  {LABEL_STATUS_GENERUS[g.status]}
                </StatusChip>
              )}
              <ChevronRight aria-hidden className="size-6 shrink-0 text-muted-foreground" />
            </Link>
          </li>
        ))}
      </ul>
      <p className="text-muted-foreground">Ketuk nama anak untuk melihat kehadiran, progres bacaan & makna, hafalan, dan capaian target.</p>
    </Konten>
  );
}

export default function AnakkuPage() {
  return (
    <Halaman>
      <PageHeader title="Anakku" subtitle="Pantau kehadiran dan capaian anak Anda" />
      <Suspense fallback={<SkeletonDaftar baris={2} />}>
        <Daftar />
      </Suspense>
    </Halaman>
  );
}
