import { ChevronRight, Printer } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Halaman, Kartu, Konten, Kosong, PageHeader, SkeletonDaftar } from "@/components/page";
import { PilihPeriode } from "@/components/pilih-periode";
import { Button } from "@/components/ui/button";
import { kelasUntukKegiatan } from "@/features/kegiatan/queries";
import { daftarKelas } from "@/features/kelas/queries";
import { daftarAnakku } from "@/features/progres/queries";
import { daftarTargetPeriode } from "@/features/rekap/queries";
import { requirePeran } from "@/lib/auth/session";
import { hariIni, inisial, labelKelas } from "@/lib/format";
import { bacaPeriode, hrefDengan, type CariPeriode, type Periode } from "@/lib/periode";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Raport · Pantau Generus" };

type Cari = CariPeriode & { kelas?: string };

async function Isi({ searchParams }: { searchParams: Promise<Cari> }) {
  const session = await requirePeran("admin", "guru", "pengurus", "wali");
  const [cari, target] = await Promise.all([searchParams, daftarTargetPeriode()]);
  const periode = bacaPeriode(cari, hariIni(), target, "bulan");

  if (session.mode === "wali") {
    const anak = await daftarAnakku(session.userId);
    return (
      <Konten>
        <Kartu>
          <PilihPeriode base="/raport" periode={periode} />
        </Kartu>
        {anak.length === 0 ? (
          <Kosong judul="Belum ada anak yang terhubung" keterangan="Hubungi admin kelompok agar akun Anda dihubungkan dengan data anak." />
        ) : (
          <DaftarAnak anak={anak.map((a) => ({ id: a.id, nama: a.nama, sub: a.kelas ? labelKelas(a.kelas) : "" }))} periode={periode} />
        )}
      </Konten>
    );
  }

  const kelas =
    session.mode === "guru"
      ? await kelasUntukKegiatan(session.userId, false)
      : (await daftarKelas({ hanyaAktif: true })).filter((k) => k.jumlahAnak > 0);
  const dipilih = kelas.find((k) => k.id === cari.kelas) ?? kelas[0];

  let anak: { id: string; nama: string }[] = [];
  if (dipilih) {
    const supabase = await createClient();
    const { data, error } = await supabase.from("generus").select("id, nama").eq("kelas_id", dipilih.id).eq("status", "aktif").order("nama");
    if (error) throw error;
    anak = data;
  }

  return (
    <Konten>
      <Kartu className="flex flex-col gap-4">
        <PilihPeriode base="/raport" periode={periode} tetap={{ kelas: dipilih?.id }} />
        <nav aria-label="Pilih kelas" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {kelas.map((k) => (
            <Link
              key={k.id}
              href={hrefDengan("/raport", { kelas: k.id }, periode.param)}
              aria-current={dipilih?.id === k.id ? "page" : undefined}
              className={cn(
                "flex h-10 shrink-0 items-center rounded-lg border px-4 text-base font-semibold whitespace-nowrap",
                dipilih?.id === k.id ? "border-primary bg-mint text-mint-foreground" : "border-input bg-card",
              )}
            >
              {labelKelas(k)}
            </Link>
          ))}
        </nav>
      </Kartu>

      {!dipilih ? (
        <Kosong judul="Belum ada kelas" />
      ) : anak.length === 0 ? (
        <Kosong judul="Belum ada anak aktif di kelas ini" />
      ) : (
        <>
          <Button asChild size="lg" className="self-start">
            <Link href={hrefDengan(`/raport/kelas/${dipilih.id}`, periode.param)}>
              <Printer aria-hidden />
              Cetak raport {labelKelas(dipilih)} ({anak.length} anak)
            </Link>
          </Button>
          <DaftarAnak anak={anak.map((a) => ({ ...a, sub: labelKelas(dipilih) }))} periode={periode} />
        </>
      )}
    </Konten>
  );
}

function DaftarAnak({ anak, periode }: { anak: { id: string; nama: string; sub: string }[]; periode: Periode }) {
  return (
    <ul className="berurutan grid grid-cols-1 gap-2.5 md:grid-cols-2 lg:grid-cols-3">
      {anak.map((a) => (
        <li key={a.id}>
          <Link
            href={hrefDengan(`/raport/${a.id}`, periode.param)}
            className="flex min-h-16 items-center gap-3.5 rounded-2xl border bg-card px-3.5 py-3 transition-[border-color,background-color,transform] duration-150 hover:border-primary/30 hover:bg-mint/40 active:scale-[0.99]"
          >
            <span aria-hidden className="flex size-10 shrink-0 items-center justify-center rounded-full bg-mint text-sm font-bold text-mint-foreground">
              {inisial(a.nama)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-lg font-medium">{a.nama}</span>
              <span className="block text-muted-foreground">{a.sub}</span>
            </span>
            <ChevronRight aria-hidden className="size-6 shrink-0 text-muted-foreground" />
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function RaportPage({ searchParams }: PageProps<"/raport">) {
  return (
    <Halaman>
      <PageHeader title="Raport" subtitle="Raport per anak yang bisa dicetak atau disimpan sebagai PDF" />
      <Suspense fallback={<SkeletonDaftar />}>
        <Isi searchParams={searchParams as Promise<Cari>} />
      </Suspense>
    </Halaman>
  );
}
