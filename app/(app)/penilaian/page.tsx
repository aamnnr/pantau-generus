import { ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { FormHeader, Halaman, JudulKelompok, Kartu, Konten, Kosong, SkeletonDaftar } from "@/components/page";
import { StatusChip } from "@/components/status-chip";
import { ambilKegiatan, kelasUntukKegiatan } from "@/features/kegiatan/queries";
import { simpanPenilaian } from "@/features/progres/actions";
import { DaftarPenilaian } from "@/features/progres/daftar-penilaian";
import { barisPenilaianButir, opsiPenilaianKelas, type BarisPenilaian, type OpsiPenilaian } from "@/features/progres/queries";
import { requirePeran } from "@/lib/auth/session";
import { formatTanggal, LABEL_ASPEK, labelKelas, labelKelasKegiatan, URUTAN_ASPEK } from "@/lib/format";

export const metadata: Metadata = { title: "Penilaian · Pantau Generus" };

type Cari = { kelas?: string; kegiatan?: string; item?: string };

/**
 * Penilaian satu butir untuk banyak anak sekaligus.
 * Alur: pilih kelas → pilih butir → nilai anak. Dari kegiatan: butir yang disampaikan → anak yang hadir.
 */
async function Isi({ searchParams }: { searchParams: Promise<Cari> }) {
  const session = await requirePeran("admin", "guru");
  const cari = await searchParams;

  if (cari.kegiatan) return <DariKegiatan kegiatanId={cari.kegiatan} itemId={cari.item} />;

  const kelas = await kelasUntukKegiatan(session.userId, session.peran.includes("admin"));
  const k = kelas.find((x) => x.id === cari.kelas);

  if (!k) {
    return (
      <>
        <FormHeader title="Penilaian" subtitle="Pilih kelas yang akan dinilai." back={{ href: "/generus", label: "Generus" }} />
        <Konten>
          {kelas.length === 0 ? (
            <Kosong judul="Belum ada kelas" keterangan="Anda belum terdaftar mengajar kelas mana pun." />
          ) : (
            <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {kelas.map((x) => (
                <li key={x.id}>
                  <TautanKartu href={`/penilaian?kelas=${x.id}`} judul={labelKelas(x)} />
                </li>
              ))}
            </ul>
          )}
        </Konten>
      </>
    );
  }

  if (!cari.item) {
    const opsi = await opsiPenilaianKelas(k);
    return (
      <>
        <FormHeader title={`Penilaian ${labelKelas(k)}`} subtitle="Pilih butir materi yang akan dinilai." back={{ href: "/penilaian", label: "Pilih kelas" }} />
        <Konten>
          <DaftarButir opsi={opsi} href={(id) => `/penilaian?kelas=${k.id}&item=${id}`} />
        </Konten>
      </>
    );
  }

  const data = await barisPenilaianButir({ kelasId: k.id }, cari.item);
  if (!data) notFound();
  return (
    <Penilai
      judul={data.item.nama}
      subtitle={`${labelKelas(k)} · ${LABEL_ASPEK[data.item.aspek]} · ${data.item.mapel}`}
      back={{ href: `/penilaian?kelas=${k.id}`, label: "Pilih butir" }}
      baris={data.baris}
    />
  );
}

async function DariKegiatan({ kegiatanId, itemId }: { kegiatanId: string; itemId?: string }) {
  const k = await ambilKegiatan(kegiatanId);
  if (!k) notFound();
  const sub = `${labelKelasKegiatan(k.ringkas.kelas)} · ${formatTanggal(k.tanggal)}`;

  if (!itemId) {
    return (
      <>
        <FormHeader title="Nilai materi pengajian" subtitle={sub} back={{ href: `/kegiatan/${k.id}`, label: "Kegiatan" }} />
        <Konten>
          <DaftarButir
            opsi={k.materiItem.map((m) => ({ ...m, target: false }))}
            href={(id) => `/penilaian?kegiatan=${k.id}&item=${id}`}
            kosong="Kegiatan ini belum mencatat materi item. Isi di langkah Materi."
          />
        </Konten>
      </>
    );
  }

  const data = await barisPenilaianButir({ kegiatanId: k.id }, itemId);
  if (!data) notFound();
  return (
    <Penilai
      judul={data.item.nama}
      subtitle={`${sub} · anak yang hadir`}
      back={{ href: `/penilaian?kegiatan=${k.id}`, label: "Pilih butir" }}
      baris={data.baris}
    />
  );
}

function Penilai({ judul, subtitle, back, baris }: {
  judul: string;
  subtitle: string;
  back: { href: string; label: string };
  baris: BarisPenilaian[];
}) {
  return (
    <>
      <FormHeader title={judul} subtitle={subtitle} back={back} />
      <Konten>
        {baris.length === 0 ? (
          <Kosong judul="Tidak ada anak untuk dinilai" keterangan="Butir ini mungkin khusus putra/putri, atau belum ada anak yang hadir." />
        ) : (
          <Kartu>
            <DaftarPenilaian baris={baris} action={simpanPenilaian} bisa />
          </Kartu>
        )}
      </Konten>
    </>
  );
}

function DaftarButir({ opsi, href, kosong = "Belum ada materi item untuk jenjang ini. Tambahkan di menu Materi." }: {
  opsi: OpsiPenilaian[];
  href: (id: string) => string;
  kosong?: string;
}) {
  if (opsi.length === 0) return <Kosong judul="Belum ada butir materi" keterangan={kosong} />;
  const target = opsi.filter((o) => o.target);
  const lain = opsi.filter((o) => !o.target);
  return (
    <div className="flex flex-col gap-4">
      {target.length > 0 && (
        <section className="flex flex-col gap-2.5">
          <JudulKelompok>Target periode ini</JudulKelompok>
          <ul className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
            {target.map((o) => (
              <li key={o.id}>
                <TautanKartu href={href(o.id)} judul={o.nama} sub={`${LABEL_ASPEK[o.aspek]} · ${o.mapel}`} target />
              </li>
            ))}
          </ul>
        </section>
      )}
      {URUTAN_ASPEK.map((a) => {
        const isi = lain.filter((o) => o.aspek === a);
        if (!isi.length) return null;
        return (
          <section key={a} className="flex flex-col gap-2.5">
            <JudulKelompok>{LABEL_ASPEK[a]}</JudulKelompok>
            <ul className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
              {isi.map((o) => (
                <li key={o.id}>
                  <TautanKartu href={href(o.id)} judul={o.nama} sub={o.mapel} />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function TautanKartu({ href, judul, sub, target }: { href: string; judul: string; sub?: string; target?: boolean }) {
  return (
    <Link
      href={href}
      className="flex min-h-16 items-center gap-3 rounded-2xl bg-card px-4 py-3 shadow-[0_1px_2px_rgba(18,20,19,0.06)] hover:bg-mint/60"
    >
      <span className="min-w-0 flex-1">
        <span className="block text-lg font-medium">{judul}</span>
        {sub && <span className="block text-muted-foreground">{sub}</span>}
      </span>
      {target && (
        <StatusChip nada="kunyit" simbol="★">
          Target
        </StatusChip>
      )}
      <ChevronRight aria-hidden className="size-6 shrink-0 text-muted-foreground" />
    </Link>
  );
}

export default function PenilaianPage({ searchParams }: PageProps<"/penilaian">) {
  return (
    <Halaman>
      <Suspense fallback={<SkeletonDaftar />}>
        <Isi searchParams={searchParams as Promise<Cari>} />
      </Suspense>
    </Halaman>
  );
}
