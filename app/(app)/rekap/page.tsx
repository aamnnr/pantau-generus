import { ChevronRight, ClipboardList, Printer } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Halaman, JudulKelompok, Kartu, Konten, Kosong, PageHeader, SkeletonDaftar } from "@/components/page";
import { PilihPeriode } from "@/components/pilih-periode";
import { formatAngka, persen } from "@/components/progres";
import { StatusChip } from "@/components/status-chip";
import { Button } from "@/components/ui/button";
import { daftarKelas, type KelasRow } from "@/features/kelas/queries";
import { daftarTargetPeriode, rekapKelas, type RekapAnak } from "@/features/rekap/queries";
import { requirePeran } from "@/lib/auth/session";
import { hariIni, labelKelas, teksPosisiTilawati } from "@/lib/format";
import { bacaPeriode, hrefDengan, type CariPeriode, type Periode } from "@/lib/periode";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Rekap · Pantau Generus" };

type Cari = CariPeriode & { kelas?: string };

async function Isi({ searchParams }: { searchParams: Promise<Cari> }) {
  await requirePeran("admin", "pengurus");
  const cari = await searchParams;
  const [kelasSemua, target] = await Promise.all([daftarKelas({ hanyaAktif: true }), daftarTargetPeriode()]);
  const periode = bacaPeriode(cari, hariIni(), target, "bulan");
  const kelasAda = kelasSemua.filter((k) => k.jumlahAnak > 0);
  const dipilih = kelasAda.find((k) => k.id === cari.kelas);
  const tampil = dipilih ? [dipilih] : kelasAda;
  const tetap = { kelas: dipilih?.id };

  const data = await Promise.all(tampil.map(async (k) => ({ kelas: k, ...(await rekapKelas(k.id, periode.dari, periode.sampai)) })));
  const perhatian = data.flatMap((d) => d.anak.filter((a) => a.perlu_perhatian).map((a) => ({ ...a, kelas: d.kelas })));

  return (
    <Konten className="gap-5">
      <Kartu className="flex flex-col gap-4">
        <PilihPeriode base="/rekap" periode={periode} tetap={tetap} />
        <nav aria-label="Pilih kelas" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {[{ id: undefined, label: "Semua kelas" }, ...kelasAda.map((k) => ({ id: k.id, label: labelKelas(k) }))].map((k) => (
            <Link
              key={k.id ?? "semua"}
              href={hrefDengan("/rekap", { kelas: k.id }, periode.param)}
              aria-current={dipilih?.id === k.id ? "page" : undefined}
              className={cn(
                "flex h-10 shrink-0 items-center rounded-lg border px-4 text-base font-semibold whitespace-nowrap",
                dipilih?.id === k.id ? "border-primary bg-mint text-mint-foreground" : "border-input bg-card",
              )}
            >
              {k.label}
            </Link>
          ))}
        </nav>
      </Kartu>

      {data.length === 0 && <Kosong judul="Belum ada anak aktif" keterangan="Tambahkan generus ke kelas melalui menu Generus." />}

      {perhatian.length > 0 && (
        <Kartu className="flex flex-col gap-3 border-2 border-bahaya-line">
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <StatusChip nada="merah" simbol="!">
              {perhatian.length}
            </StatusChip>
            Perlu perhatian
          </h2>
          <p className="text-muted-foreground">Kehadiran di bawah ambang pada {periode.label}.</p>
          <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {perhatian.map((a) => (
              <li key={a.generus_id}>
                <Link
                  href={hrefDengan(`/generus/${a.generus_id}`, periode.param)}
                  className="flex min-h-12 items-center gap-3 rounded-xl bg-bahaya-soft px-4 py-2 text-bahaya hover:bg-bahaya-line/60"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{a.nama}</span>
                    <span className="block">{labelKelas(a.kelas)}</span>
                  </span>
                  <span className="text-lg font-bold tabular-nums">{a.persen}%</span>
                  <ChevronRight aria-hidden className="size-5" />
                </Link>
              </li>
            ))}
          </ul>
        </Kartu>
      )}

      {data.map((d) => (
        <RekapSatuKelas key={d.kelas.id} kelas={d.kelas} anak={d.anak} ringkas={d.ringkas} periode={periode} />
      ))}
    </Konten>
  );
}

function RekapSatuKelas({ kelas, anak, ringkas, periode }: {
  kelas: KelasRow;
  anak: RekapAnak[];
  ringkas: Awaited<ReturnType<typeof rekapKelas>>["ringkas"];
  periode: Periode;
}) {
  const caberawit = kelas.jenjang === "caberawit";
  // Caberawit tidak memakai makna Al-Qur'an/Al-Hadist (PRD §5) → tanpa kolom "Materi diikuti".
  const angkaRingkas = [
    { label: "Rata-rata kehadiran", nilai: ringkas.rata_kehadiran },
    ...(caberawit ? [] : [{ label: "Materi diikuti", nilai: ringkas.rata_ketuntasan }]),
    { label: "Butir target tuntas", nilai: ringkas.rata_target },
  ];

  return (
    <section className="flex flex-col gap-3" aria-labelledby={`rekap-${kelas.id}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <JudulKelompok>
          <span id={`rekap-${kelas.id}`} className="text-xl text-foreground">
            {labelKelas(kelas)}
          </span>{" "}
          · {ringkas.jumlah_anak} anak
        </JudulKelompok>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href={hrefDengan("/lembar-presensi", { kelas: kelas.id }, { bulan: periode.dari.slice(0, 7) })}>
              <ClipboardList aria-hidden />
              Lembar presensi
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={hrefDengan("/raport", { kelas: kelas.id }, periode.param)}>
              <Printer aria-hidden />
              Raport kelas
            </Link>
          </Button>
        </div>
      </div>

      <dl className={cn("grid gap-2", caberawit ? "grid-cols-2" : "grid-cols-3")}>
        {angkaRingkas.map((x) => (
          <Kartu key={x.label} className="flex flex-col gap-0.5 p-3 lg:p-4">
            <dd className="text-2xl font-bold text-primary tabular-nums">{x.nilai == null ? "—" : `${x.nilai}%`}</dd>
            <dt className="text-base leading-snug text-muted-foreground">{x.label}</dt>
          </Kartu>
        ))}
      </dl>

      {/* HP & tablet: kartu */}
      <ul className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:hidden">
        {anak.map((a) => (
          <li key={a.generus_id}>
            <Link
              href={hrefDengan(`/generus/${a.generus_id}`, periode.param)}
              className="flex flex-col gap-2 rounded-2xl bg-card px-4 py-3 border transition-colors hover:border-primary/40 hover:bg-mint/40"
            >
              <span className="flex items-center gap-2">
                <span className="min-w-0 flex-1 truncate text-lg font-medium">{a.nama}</span>
                {a.perlu_perhatian && (
                  <StatusChip nada="merah" simbol="!">
                    Perhatian
                  </StatusChip>
                )}
                <ChevronRight aria-hidden className="size-5 shrink-0 text-muted-foreground" />
              </span>
              <span className="grid grid-cols-2 gap-x-3 gap-y-1 text-base">
                <Nilai label="Hadir" isi={teksHadir(a)} />
                {!caberawit && <Nilai label="Materi" isi={teksMateri(a)} />}
                <Nilai label="Target" isi={teksTarget(a)} />
                {caberawit && <Nilai label="Tilawati" isi={teksTilawati(a)} />}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {/* Desktop: tabel */}
      <div className="hidden overflow-x-auto rounded-2xl bg-card border lg:block">
        <table className="w-full min-w-[760px] border-collapse text-left text-lg">
          <thead>
            <tr className="bg-mint text-base text-mint-foreground">
              <th scope="col" className="px-4 py-3 font-semibold">Nama</th>
              <th scope="col" className="px-2 py-3 font-semibold">Kehadiran</th>
              {!caberawit && <th scope="col" className="px-2 py-3 font-semibold">Materi diikuti</th>}
              <th scope="col" className="px-2 py-3 font-semibold">Butir target tuntas</th>
              {caberawit && <th scope="col" className="px-2 py-3 font-semibold">Tilawati</th>}
            </tr>
          </thead>
          <tbody>
            {anak.map((a) => (
              <tr key={a.generus_id} className={cn("border-t border-border", a.perlu_perhatian && "bg-bahaya-soft/50")}>
                <td className="px-4 py-3">
                  <Link href={hrefDengan(`/generus/${a.generus_id}`, periode.param)} className="font-medium text-primary underline-offset-4 hover:underline">
                    {a.nama}
                  </Link>
                </td>
                <td className="px-2 py-3">
                  <span className="flex items-center gap-2">
                    {teksHadir(a)}
                    {a.perlu_perhatian && (
                      <StatusChip nada="merah" simbol="!">
                        Perhatian
                      </StatusChip>
                    )}
                  </span>
                </td>
                {!caberawit && <td className="px-2 py-3">{teksMateri(a)}</td>}
                <td className="px-2 py-3">{teksTarget(a)}</td>
                {caberawit && <td className="px-2 py-3">{teksTilawati(a)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Nilai({ label, isi }: { label: string; isi: string }) {
  return (
    <span>
      <span className="text-muted-foreground">{label}: </span>
      <span className="font-medium">{isi}</span>
    </span>
  );
}

const teksHadir = (a: RekapAnak) => (a.total ? `${a.persen}% (${a.hadir}/${a.total})` : "—");
const teksMateri = (a: RekapAnak) =>
  a.satuan_kelas ? `${persen(a.satuan_diikuti, a.satuan_kelas)}% (${formatAngka(a.satuan_diikuti)}/${formatAngka(a.satuan_kelas)})` : "—";
const teksTarget = (a: RekapAnak) => (a.butir_target ? `${a.butir_tuntas}/${a.butir_target} butir` : "—");
const teksTilawati = (a: RekapAnak) => (a.tilawati_jilid ? teksPosisiTilawati({ jilid: a.tilawati_jilid, halaman: a.tilawati_halaman }) : "—");

export default function RekapPage({ searchParams }: PageProps<"/rekap">) {
  return (
    <Halaman>
      <PageHeader title="Rekap" subtitle="Kehadiran dan capaian setiap anak per periode, tanpa peringkat" />
      <Suspense fallback={<SkeletonDaftar />}>
        <Isi searchParams={searchParams as Promise<Cari>} />
      </Suspense>
    </Halaman>
  );
}
