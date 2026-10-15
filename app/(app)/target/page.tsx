import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Halaman, JudulKelompok, Kosong, Konten, PageHeader, SkeletonDaftar } from "@/components/page";
import { Button } from "@/components/ui/button";
import { KartuTarget } from "@/features/target/kartu-target";
import { daftarTarget } from "@/features/target/queries";
import { getSession } from "@/lib/auth/session";
import { hariIni } from "@/lib/format";

export const metadata: Metadata = { title: "Target · Pantau Generus" };

async function Daftar() {
  const session = await getSession();
  await connection();
  const [target, hari] = [await daftarTarget(), hariIni()];
  const bisaBuat = session.peran.includes("admin") || session.peran.includes("guru");

  if (target.length === 0) {
    return (
      <Konten>
        <Kosong
          judul="Belum ada target"
          keterangan="Masukkan target materi dari tim kurikulum PPG per periode, mis. Periode Bulan Oktober (5 Okt – 7 Nov)."
          aksi={
            bisaBuat && (
              <Button asChild size="lg">
                <Link href="/target/baru">Buat Target</Link>
              </Button>
            )
          }
        />
      </Konten>
    );
  }

  const kelompok = [
    { judul: "Sedang berjalan", isi: target.filter((t) => t.mulai <= hari && t.selesai >= hari) },
    { judul: "Akan datang", isi: target.filter((t) => t.mulai > hari).reverse() },
    { judul: "Sudah lewat", isi: target.filter((t) => t.selesai < hari) },
  ];

  return (
    <Konten>
      {kelompok
        .filter((g) => g.isi.length)
        .map((g) => (
          <section key={g.judul} className="flex flex-col gap-2.5">
            <JudulKelompok>{g.judul}</JudulKelompok>
            <ul className="berurutan grid grid-cols-1 gap-2.5 md:grid-cols-2">
              {g.isi.map((t) => (
                <li key={t.id}>
                  <KartuTarget t={t} />
                </li>
              ))}
            </ul>
          </section>
        ))}
    </Konten>
  );
}

async function TombolBuat() {
  const { peran } = await getSession();
  if (!peran.includes("admin") && !peran.includes("guru")) return null;
  return (
    <Button asChild size="lg">
      <Link href="/target/baru">
        <Plus aria-hidden />
        Buat Target
      </Link>
    </Button>
  );
}

export default function TargetPage() {
  return (
    <Halaman>
      <PageHeader
        title="Target"
        subtitle="Target materi dari tim kurikulum PPG per periode"
        actions={
          <Suspense fallback={null}>
            <TombolBuat />
          </Suspense>
        }
      />
      <Suspense fallback={<SkeletonDaftar />}>
        <Daftar />
      </Suspense>
    </Halaman>
  );
}
