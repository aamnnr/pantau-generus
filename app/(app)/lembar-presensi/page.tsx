import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Halaman, Kartu, Konten, Kosong, PageHeader, SkeletonDaftar } from "@/components/page";
import { kelasUntukKegiatan } from "@/features/kegiatan/queries";
import { namaKelompok } from "@/features/raport/queries";
import { TombolCetak } from "@/features/raport/tombol-cetak";
import { requirePeran } from "@/lib/auth/session";
import { hariIni, labelKelas, type StatusPresensi } from "@/lib/format";
import { bacaPeriode, hrefDengan } from "@/lib/periode";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Lembar Presensi · Pantau Generus" };

type Cari = { kelas?: string; bulan?: string };

const KODE: Record<StatusPresensi, string> = { hadir: "H", terlambat: "T", izin: "I", sakit: "S", alpa: "A" };

/** Tanggal (YYYY-MM-DD) dalam rentang yang harinya termasuk `hariIso` (1 = Senin … 7 = Minggu). */
function tanggalJadwal(dari: string, sampai: string, hariIso: Set<number>) {
  const hasil: string[] = [];
  for (let d = new Date(`${dari}T00:00:00Z`); d.toISOString().slice(0, 10) <= sampai; d.setUTCDate(d.getUTCDate() + 1)) {
    if (hariIso.has(d.getUTCDay() || 7)) hasil.push(d.toISOString().slice(0, 10));
  }
  return hasil;
}

/**
 * Lembar presensi cetak per kelas per bulan untuk guru yang memakai kertas (PRD F4).
 * Kolom = tanggal jadwal rutin kelas + kegiatan yang sudah ada; sel terisi bila presensi sudah dicatat.
 */
async function Isi({ searchParams }: { searchParams: Promise<Cari> }) {
  const session = await requirePeran("admin", "guru", "pengurus");
  const cari = await searchParams;
  const periode = bacaPeriode({ periode: "bulan", bulan: cari.bulan }, hariIni(), [], "bulan");
  const kelas = await kelasUntukKegiatan(session.userId, session.peran.includes("admin") || session.peran.includes("pengurus"));
  const k = kelas.find((x) => x.id === cari.kelas) ?? kelas[0];
  if (!k) return <Konten><Kosong judul="Belum ada kelas" /></Konten>;

  const supabase = await createClient();
  const [kelompok, anak, jadwal, kegiatan] = await Promise.all([
    namaKelompok(),
    supabase.from("generus").select("id, nama").eq("kelas_id", k.id).eq("status", "aktif").order("nama"),
    supabase.from("jadwal_rutin_kelas").select("jadwal:jadwal_rutin_id (hari, aktif)").eq("kelas_id", k.id),
    supabase
      .from("kegiatan_kelas")
      .select("kegiatan:kegiatan_id (id, tanggal, status, presensi (generus_id, status))")
      .eq("kelas_id", k.id),
  ]);
  for (const r of [anak, jadwal, kegiatan]) if (r.error) throw r.error;

  const dalamBulan = (kegiatan.data ?? [])
    .map((x) => x.kegiatan)
    .filter((g): g is NonNullable<typeof g> => !!g && g.tanggal >= periode.dari && g.tanggal <= periode.sampai);
  const libur = new Set(dalamBulan.filter((g) => g.status === "batal").map((g) => g.tanggal));
  const hari = new Set((jadwal.data ?? []).map((j) => j.jadwal).filter((j) => j?.aktif).map((j) => j!.hari));
  const tanggal = [...new Set([...tanggalJadwal(periode.dari, periode.sampai, hari), ...dalamBulan.map((g) => g.tanggal)])]
    .filter((t) => !libur.has(t))
    .sort();
  const status = new Map<string, StatusPresensi>();
  for (const g of dalamBulan) for (const p of g.presensi) status.set(`${p.generus_id}:${g.tanggal}`, p.status);

  const tautan = (bulan: Record<string, string> | undefined) => hrefDengan("/lembar-presensi", { kelas: k.id }, bulan && { bulan: bulan.bulan });

  return (
    <Konten>
      <Style />
      <Kartu className="flex flex-col gap-4 print:hidden">
        <div className="flex items-center gap-2">
          <Link href={tautan(periode.sebelum)} aria-label="Bulan sebelumnya" className="flex size-12 items-center justify-center rounded-xl bg-secondary text-primary">
            <ChevronLeft aria-hidden className="size-6" />
          </Link>
          <p className="flex-1 text-center text-lg font-semibold">{periode.label}</p>
          <Link href={tautan(periode.sesudah)} aria-label="Bulan sesudahnya" className="flex size-12 items-center justify-center rounded-xl bg-secondary text-primary">
            <ChevronRight aria-hidden className="size-6" />
          </Link>
        </div>
        <nav aria-label="Pilih kelas" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {kelas.map((x) => (
            <Link
              key={x.id}
              href={hrefDengan("/lembar-presensi", { kelas: x.id }, { bulan: periode.param.bulan })}
              aria-current={x.id === k.id ? "page" : undefined}
              className={cn(
                "flex h-12 shrink-0 items-center rounded-xl border-[1.5px] px-4 text-base font-semibold whitespace-nowrap",
                x.id === k.id ? "border-2 border-primary bg-mint text-mint-foreground" : "border-input bg-card",
              )}
            >
              {labelKelas(x)}
            </Link>
          ))}
        </nav>
        <TombolCetak />
        <p className="text-muted-foreground">
          Kolom tanggal diambil dari jadwal rutin kelas dan kegiatan yang sudah ada. Kehadiran yang sudah dicatat di aplikasi ikut tercetak.
        </p>
      </Kartu>

      <article className="flex flex-col gap-3 overflow-x-auto rounded-2xl bg-card p-4 shadow-[0_1px_2px_rgba(18,20,19,0.06)] print:overflow-visible print:rounded-none print:p-0 print:text-[10pt] print:shadow-none">
        <header className="text-center">
          <p className="font-bold uppercase">{kelompok}</p>
          <h2 className="text-xl font-bold print:text-[14pt]">Lembar Presensi {labelKelas(k)}</h2>
          <p>{periode.label}</p>
        </header>
        {(anak.data ?? []).length === 0 ? (
          <p>Belum ada anak aktif di kelas ini.</p>
        ) : (
          <table className="w-full border-collapse text-left">
            <thead>
              <tr>
                <th scope="col" className="w-10 border border-foreground px-1 py-1 text-center">No</th>
                <th scope="col" className="min-w-44 border border-foreground px-2 py-1">Nama</th>
                {tanggal.map((t) => (
                  <th key={t} scope="col" className="min-w-10 border border-foreground px-1 py-1 text-center tabular-nums">
                    {Number(t.slice(8))}
                  </th>
                ))}
                {tanggal.length < 8 &&
                  Array.from({ length: 8 - tanggal.length }, (_, i) => <th key={`k${i}`} className="min-w-10 border border-foreground" aria-label="Kolom kosong" />)}
              </tr>
            </thead>
            <tbody>
              {(anak.data ?? []).map((a, i) => (
                <tr key={a.id}>
                  <td className="border border-foreground px-1 py-1.5 text-center tabular-nums">{i + 1}</td>
                  <td className="border border-foreground px-2 py-1.5">{a.nama}</td>
                  {tanggal.map((t) => {
                    const s = status.get(`${a.id}:${t}`);
                    return (
                      <td key={t} className="border border-foreground px-1 py-1.5 text-center font-semibold">
                        {s ? KODE[s] : ""}
                      </td>
                    );
                  })}
                  {tanggal.length < 8 && Array.from({ length: 8 - tanggal.length }, (_, j) => <td key={`k${j}`} className="border border-foreground" />)}
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p>Keterangan: H = Hadir · T = Terlambat · I = Izin · S = Sakit · A = Alpa</p>
      </article>
    </Konten>
  );
}

/** Lembar presensi lebar → cetak mendatar. */
function Style() {
  return <style>{"@media print { @page { size: A4 landscape; margin: 10mm; } }"}</style>;
}

export default function LembarPresensiPage({ searchParams }: PageProps<"/lembar-presensi">) {
  return (
    <Halaman>
      <div className="print:hidden">
        <PageHeader title="Lembar Presensi" subtitle="Cetak daftar hadir per kelas per bulan untuk dipakai di kertas" />
      </div>
      <Suspense fallback={<SkeletonDaftar />}>
        <Isi searchParams={searchParams as Promise<Cari>} />
      </Suspense>
    </Halaman>
  );
}
