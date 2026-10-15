import { ClipboardList } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Halaman, JudulKelompok, Kosong, Konten, PageHeader, SkeletonDaftar } from "@/components/page";
import { Button } from "@/components/ui/button";
import { KartuKegiatan } from "@/features/kegiatan/kartu-kegiatan";
import { riwayatKegiatan } from "@/features/kegiatan/queries";
import { requirePeran } from "@/lib/auth/session";
import { formatTanggal } from "@/lib/format";

export const metadata: Metadata = { title: "Riwayat · Pantau Generus" };

const HARI = 60;

async function Daftar() {
  await requirePeran("admin", "guru", "pengurus");
  const kegiatan = await riwayatKegiatan(HARI);
  if (kegiatan.length === 0) {
    return (
      <Konten>
        <Kosong judul="Belum ada kegiatan" keterangan={`Kegiatan ${HARI} hari terakhir akan tampil di sini.`} />
      </Konten>
    );
  }
  const tanggal = [...new Set(kegiatan.map((k) => k.tanggal))];
  return (
    <Konten>
      {tanggal.map((t) => (
        <section key={t} className="flex flex-col gap-2.5">
          <JudulKelompok>{formatTanggal(t)}</JudulKelompok>
          <ul className="berurutan grid grid-cols-1 gap-2.5 md:grid-cols-2">
            {kegiatan
              .filter((k) => k.tanggal === t)
              .map((k) => (
                <li key={k.id}>
                  <KartuKegiatan k={k} />
                </li>
              ))}
          </ul>
        </section>
      ))}
    </Konten>
  );
}

export default function RiwayatPage() {
  return (
    <Halaman>
      <PageHeader
        title="Riwayat"
        subtitle={`Kegiatan ${HARI} hari terakhir`}
        actions={
          <Button asChild size="lg" variant="outline">
            <Link href="/lembar-presensi">
              <ClipboardList aria-hidden />
              Lembar presensi
            </Link>
          </Button>
        }
      />
      <Suspense fallback={<SkeletonDaftar />}>
        <Daftar />
      </Suspense>
    </Halaman>
  );
}
