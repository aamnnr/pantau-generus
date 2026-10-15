import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BackLink, Halaman, SkeletonDaftar } from "@/components/page";
import { PilihPeriode } from "@/components/pilih-periode";
import { ambilProgresAnak } from "@/features/progres/queries";
import { simpanCatatanRaport } from "@/features/raport/actions";
import { CatatanForm } from "@/features/raport/catatan-form";
import { bolehTulisCatatan, catatanRaport, namaKelompok } from "@/features/raport/queries";
import { GayaCetakRaport, RaportAnak } from "@/features/raport/raport-anak";
import { TombolCetak } from "@/features/raport/tombol-cetak";
import { daftarTargetPeriode } from "@/features/rekap/queries";
import { requirePeran } from "@/lib/auth/session";
import { hariIni } from "@/lib/format";
import { bacaPeriode, hrefDengan, type CariPeriode } from "@/lib/periode";

export const metadata: Metadata = { title: "Raport · Pantau Generus" };

async function Isi({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<CariPeriode> }) {
  const session = await requirePeran("admin", "guru", "pengurus", "wali");
  const [{ id }, cari, target] = await Promise.all([params, searchParams, daftarTargetPeriode()]);
  const periode = bacaPeriode(cari, hariIni(), target, "bulan");
  const [d, kelompok, catatan, boleh] = await Promise.all([
    ambilProgresAnak(id, periode),
    namaKelompok(),
    catatanRaport(id, periode.dari, periode.sampai),
    bolehTulisCatatan(id, session.peran),
  ]);
  if (!d) notFound();

  // Catatan disimpan per bulan: raport bulanan/periode target menulis ke bulan awal periodenya;
  // raport semester/keseluruhan menampilkan catatan bulan-bulan di dalamnya.
  const bulanCatatan = periode.jenis === "bulan" || periode.jenis === "target" ? `${periode.dari.slice(0, 7)}-01` : null;
  const awal = catatan.find((c) => c.bulan === bulanCatatan)?.catatan ?? "";

  return (
    <>
      <GayaCetakRaport />
      <div className="flex flex-col gap-3 px-4 pt-3 print:hidden lg:px-0 lg:pt-0">
        <BackLink href={hrefDengan(`/generus/${id}`, periode.param)} label={d.anak.nama} className="text-primary" />
        <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
          <PilihPeriode base={`/raport/${id}`} periode={periode} />
          <TombolCetak />
        </div>
      </div>
      <div className="px-4 lg:px-0 print:px-0">
        <RaportAnak d={d} periode={periode} kelompok={kelompok} catatan={catatan.filter((c) => c.bulan !== bulanCatatan || !boleh)}>
          {boleh && bulanCatatan && <CatatanForm bulan={bulanCatatan} awal={awal} action={simpanCatatanRaport.bind(null, id)} />}
          {boleh && bulanCatatan && awal && <p className="hidden whitespace-pre-line print:block">{awal}</p>}
        </RaportAnak>
      </div>
    </>
  );
}

export default function RaportAnakPage({ params, searchParams }: PageProps<"/raport/[id]">) {
  return (
    <Halaman>
      <Suspense fallback={<SkeletonDaftar baris={4} />}>
        <Isi params={params} searchParams={searchParams as Promise<CariPeriode>} />
      </Suspense>
    </Halaman>
  );
}
