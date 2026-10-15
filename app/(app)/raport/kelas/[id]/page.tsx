import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BackLink, Halaman, Kosong, SkeletonDaftar } from "@/components/page";
import { PilihPeriode } from "@/components/pilih-periode";
import { ambilKelas } from "@/features/kelas/queries";
import { ambilProgresAnak } from "@/features/progres/queries";
import { catatanRaport, namaKelompok } from "@/features/raport/queries";
import { GayaCetakRaport, RaportAnak } from "@/features/raport/raport-anak";
import { TombolCetak } from "@/features/raport/tombol-cetak";
import { daftarTargetPeriode } from "@/features/rekap/queries";
import { requirePeran } from "@/lib/auth/session";
import { hariIni, labelKelas } from "@/lib/format";
import { bacaPeriode, hrefDengan, type CariPeriode } from "@/lib/periode";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Raport Kelas · Pantau Generus" };

/** Semua raport satu kelas sekaligus untuk dicetak: satu anak per halaman. */
async function Isi({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<CariPeriode> }) {
  await requirePeran("admin", "guru", "pengurus");
  const [{ id }, cari, target] = await Promise.all([params, searchParams, daftarTargetPeriode()]);
  const periode = bacaPeriode(cari, hariIni(), target, "bulan");
  const supabase = await createClient();
  const [kelas, kelompok, { data: anak, error }] = await Promise.all([
    ambilKelas(id),
    namaKelompok(),
    supabase.from("generus").select("id").eq("kelas_id", id).eq("status", "aktif").order("nama"),
  ]);
  if (error) throw error;
  if (!kelas) notFound();

  const raport = await Promise.all(
    anak.map(async (a) => {
      const [d, catatan] = await Promise.all([ambilProgresAnak(a.id, periode), catatanRaport(a.id, periode.dari, periode.sampai)]);
      return d && { d, catatan };
    }),
  );

  return (
    <>
      <GayaCetakRaport />
      <div className="flex flex-col gap-3 px-4 pt-3 print:hidden lg:px-0 lg:pt-0">
        <BackLink href={hrefDengan("/raport", { kelas: id }, periode.param)} label="Raport" className="text-primary" />
        <h1 className="text-2xl font-bold">Raport {labelKelas(kelas)}</h1>
        <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
          <PilihPeriode base={`/raport/kelas/${id}`} periode={periode} />
          <TombolCetak label={`Cetak ${anak.length} raport`} />
        </div>
      </div>
      <div className="flex flex-col gap-6 px-4 lg:px-0 print:gap-0 print:px-0">
        {raport.length === 0 && <Kosong judul="Belum ada anak aktif di kelas ini" />}
        {raport.map(
          (r) =>
            r && (
              <RaportAnak key={r.d.anak.id} d={r.d} periode={periode} kelompok={kelompok} catatan={r.catatan} className="print:break-after-page" />
            ),
        )}
      </div>
    </>
  );
}

export default function RaportKelasPage({ params, searchParams }: PageProps<"/raport/kelas/[id]">) {
  return (
    <Halaman>
      <Suspense fallback={<SkeletonDaftar baris={4} />}>
        <Isi params={params} searchParams={searchParams as Promise<CariPeriode>} />
      </Suspense>
    </Halaman>
  );
}
