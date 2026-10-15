import { CalendarCheck2, CircleAlert, CircleCheck, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Halaman, Kerangka, Kosong, Konten, PageHeader, SkeletonDaftar } from "@/components/page";
import { KotakAngka } from "@/components/stat";
import { Button } from "@/components/ui/button";
import { KartuKegiatan, statusKegiatan } from "@/features/kegiatan/kartu-kegiatan";
import { PilihTanggal } from "@/features/kegiatan/pilih-tanggal";
import { kegiatanTanggal } from "@/features/kegiatan/queries";
import { getSession, requirePeran } from "@/lib/auth/session";
import { formatTanggal, hariIni } from "@/lib/format";

export const metadata: Metadata = { title: "Pengajian Hari Ini · Pantau Generus" };

type SP = Promise<{ tanggal?: string }>;

async function pilihTanggal(searchParams: SP) {
  const { tanggal } = await searchParams;
  // "Hari ini" bergantung pada jam saat request, jangan dihitung saat prerender.
  await connection();
  return tanggal && /^\d{4}-\d{2}-\d{2}$/.test(tanggal) ? tanggal : hariIni();
}

async function Sapaan() {
  const { nama } = await getSession();
  return <>Assalamu&apos;alaikum, {nama.split(" ")[0]}</>;
}

async function Keterangan({ searchParams }: { searchParams: SP }) {
  const tanggal = await pilihTanggal(searchParams);
  const hari = hariIni();
  if (tanggal === hari) return <>Berikut pengajian hari ini. Semoga lancar dan berkah.</>;
  return <>{tanggal < hari ? "Pengajian yang sudah lewat" : "Pengajian mendatang"}</>;
}

async function NavigasiTanggal({ searchParams }: { searchParams: SP }) {
  const tanggal = await pilihTanggal(searchParams);
  return <PilihTanggal tanggal={tanggal} hari={hariIni()} label={formatTanggal(tanggal)} />;
}

async function Daftar({ searchParams }: { searchParams: SP }) {
  const session = await requirePeran("admin", "guru", "pengurus");
  const tanggal = await pilihTanggal(searchParams);
  const kegiatan = await kegiatanTanggal(tanggal);
  const bisaTambah = session.peran.includes("admin") || session.peran.includes("guru");

  if (kegiatan.length === 0) {
    return (
      <Konten>
        <Kosong
          ikon={CalendarCheck2}
          judul="Belum ada kegiatan pada tanggal ini"
          keterangan={
            session.peran.includes("admin")
              ? "Kegiatan rutin muncul otomatis dari Jadwal Rutin. Untuk pengajian di luar jadwal, tambah kegiatan lain."
              : "Kegiatan rutin muncul otomatis dari jadwal kelas Anda."
          }
          aksi={
            bisaTambah && (
              <div className="flex flex-wrap justify-center gap-2">
                <Button asChild>
                  <Link href={`/kegiatan/baru?tanggal=${tanggal}`}>
                    <Plus aria-hidden />
                    Tambah Kegiatan
                  </Link>
                </Button>
                {session.peran.includes("admin") && (
                  <Button asChild variant="outline">
                    <Link href="/kelola/jadwal">Atur Jadwal Rutin</Link>
                  </Button>
                )}
              </div>
            )
          }
        />
      </Konten>
    );
  }

  const aktif = kegiatan.filter((k) => k.status !== "batal");
  const belum = aktif.filter((k) => statusKegiatan(k).label === "Belum diisi").length;

  return (
    <Konten>
      <div className="grid grid-cols-3 gap-2.5 lg:gap-3">
        <KotakAngka ikon={CalendarCheck2} nilai={aktif.length} label="Kegiatan" />
        <KotakAngka ikon={CircleCheck} nilai={aktif.length - belum} label="Sudah diisi" nada="biru" />
        <KotakAngka ikon={CircleAlert} nilai={belum} label="Belum diisi" nada={belum ? "oranye" : "abu"} />
      </div>
      <div className="flex items-center justify-between gap-2 pt-1">
        <h2 className="text-lg font-semibold">Daftar pengajian</h2>
        {bisaTambah && (
          <Button asChild variant="outline" size="sm">
            <Link href={`/kegiatan/baru?tanggal=${tanggal}`}>
              <Plus aria-hidden />
              Kegiatan lain
            </Link>
          </Button>
        )}
      </div>
      <ul className="berurutan grid grid-cols-1 gap-2.5 md:grid-cols-2">
        {kegiatan.map((k) => (
          <li key={k.id}>
            <KartuKegiatan k={k} />
          </li>
        ))}
      </ul>
    </Konten>
  );
}

export default function HariIniPage({ searchParams }: PageProps<"/hari-ini">) {
  const sp = searchParams as SP;
  return (
    <Halaman>
      <PageHeader
        title={
          <Suspense fallback="Assalamu'alaikum">
            <Sapaan />
          </Suspense>
        }
        subtitle={
          <Suspense fallback={<span className="opacity-0">.</span>}>
            <Keterangan searchParams={sp} />
          </Suspense>
        }
      >
        <Suspense fallback={<Kerangka className="h-11 w-72 rounded-xl" />}>
          <NavigasiTanggal searchParams={sp} />
        </Suspense>
      </PageHeader>
      <Suspense fallback={<SkeletonDaftar baris={3} />}>
        <Daftar searchParams={sp} />
      </Suspense>
    </Halaman>
  );
}
