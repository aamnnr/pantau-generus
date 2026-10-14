import { CalendarDays, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Halaman, Kosong, Konten, PageHeader, SkeletonDaftar } from "@/components/page";
import { Button } from "@/components/ui/button";
import { KartuKegiatan } from "@/features/kegiatan/kartu-kegiatan";
import { kegiatanTanggal } from "@/features/kegiatan/queries";
import { getSession, requirePeran } from "@/lib/auth/session";
import { formatTanggal, geserTanggal, hariIni } from "@/lib/format";

export const metadata: Metadata = { title: "Pengajian Hari Ini · Pantau Generus" };

type SP = Promise<{ tanggal?: string }>;

async function pilihTanggal(searchParams: SP) {
  const { tanggal } = await searchParams;
  // "Hari ini" bergantung pada jam saat request, jangan dihitung saat prerender.
  await connection();
  return tanggal && /^\d{4}-\d{2}-\d{2}$/.test(tanggal) ? tanggal : hariIni();
}

async function Judul({ searchParams }: { searchParams: SP }) {
  const tanggal = await pilihTanggal(searchParams);
  return <>{formatTanggal(tanggal)}</>;
}

async function Sapaan({ searchParams }: { searchParams: SP }) {
  const [{ nama }, tanggal] = await Promise.all([getSession(), pilihTanggal(searchParams)]);
  const hari = hariIni();
  const keterangan = tanggal === hari ? "Pengajian hari ini" : tanggal < hari ? "Pengajian yang lalu" : "Pengajian mendatang";
  return (
    <>
      Assalamu&apos;alaikum, {nama} · {keterangan}
    </>
  );
}

async function NavigasiTanggal({ searchParams }: { searchParams: SP }) {
  const tanggal = await pilihTanggal(searchParams);
  const hari = hariIni();
  const tautan = "inline-flex h-12 items-center gap-1 rounded-xl bg-white/15 px-3 text-base font-semibold text-brand-foreground hover:bg-white/25 lg:bg-card lg:text-foreground lg:shadow-sm lg:hover:bg-mint";
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link href={`/hari-ini?tanggal=${geserTanggal(tanggal, -1)}`} className={tautan}>
        <ChevronLeft aria-hidden className="size-5" />
        {tanggal === hari ? "Kemarin" : "Sebelumnya"}
      </Link>
      {tanggal !== hari && (
        <Link href="/hari-ini" className={tautan}>
          Hari ini
        </Link>
      )}
      <Link href={`/hari-ini?tanggal=${geserTanggal(tanggal, 1)}`} className={tautan}>
        Berikutnya
        <ChevronRight aria-hidden className="size-5" />
      </Link>
      <form action="/hari-ini" className="flex items-center gap-2">
        <label className={`${tautan} cursor-pointer`}>
          <CalendarDays aria-hidden className="size-5" />
          <span className="sr-only">Pilih tanggal</span>
          <input
            type="date"
            name="tanggal"
            defaultValue={tanggal}
            className="w-36 bg-transparent text-base outline-none [color-scheme:light]"
          />
        </label>
        <Button type="submit" variant="secondary" className="bg-kunyit text-kunyit-foreground hover:bg-kunyit/85">
          Buka
        </Button>
      </form>
    </div>
  );
}

async function Daftar({ searchParams }: { searchParams: SP }) {
  const session = await requirePeran("admin", "guru", "pengurus");
  const tanggal = await pilihTanggal(searchParams);
  const kegiatan = await kegiatanTanggal(tanggal);
  const bisaTambah = session.peran.includes("admin") || session.peran.includes("guru");

  return (
    <Konten>
      {kegiatan.length === 0 ? (
        <Kosong
          judul="Belum ada kegiatan pada tanggal ini"
          keterangan={
            session.peran.includes("admin")
              ? "Kegiatan rutin muncul otomatis dari Jadwal Rutin. Untuk pengajian di luar jadwal, tambah kegiatan lain."
              : "Kegiatan rutin muncul otomatis dari jadwal kelas Anda."
          }
          aksi={
            bisaTambah && (
              <div className="flex flex-wrap justify-center gap-2">
                <Button asChild size="lg">
                  <Link href={`/kegiatan/baru?tanggal=${tanggal}`}>Tambah Kegiatan</Link>
                </Button>
                {session.peran.includes("admin") && (
                  <Button asChild size="lg" variant="outline">
                    <Link href="/kelola/jadwal">Atur Jadwal Rutin</Link>
                  </Button>
                )}
              </div>
            )
          }
        />
      ) : (
        <ul className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
          {kegiatan.map((k) => (
            <li key={k.id}>
              <KartuKegiatan k={k} />
            </li>
          ))}
        </ul>
      )}
      {bisaTambah && kegiatan.length > 0 && (
        <Button asChild variant="outline" size="lg" className="w-full lg:w-fit">
          <Link href={`/kegiatan/baru?tanggal=${tanggal}`}>
            <Plus aria-hidden />
            Kegiatan Lain
          </Link>
        </Button>
      )}
    </Konten>
  );
}

export default function HariIniPage({ searchParams }: PageProps<"/hari-ini">) {
  const sp = searchParams as SP;
  return (
    <Halaman>
      <PageHeader
        title={
          <Suspense fallback="Pengajian Hari Ini">
            <Judul searchParams={sp} />
          </Suspense>
        }
        subtitle={
          <Suspense fallback={<span className="opacity-0">.</span>}>
            <Sapaan searchParams={sp} />
          </Suspense>
        }
      >
        <Suspense fallback={<div className="h-12" />}>
          <NavigasiTanggal searchParams={sp} />
        </Suspense>
      </PageHeader>
      <Suspense fallback={<SkeletonDaftar baris={3} />}>
        <Daftar searchParams={sp} />
      </Suspense>
    </Halaman>
  );
}
