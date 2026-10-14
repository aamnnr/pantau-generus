import { CalendarX2, CheckCheck, Pencil, RotateCcw } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BackLink, Halaman, Kartu, SkeletonDaftar } from "@/components/page";
import { StatusChip } from "@/components/status-chip";
import { TombolHapus } from "@/components/tombol-hapus";
import { Button } from "@/components/ui/button";
import { aturStatusKegiatan, simpanMateri, simpanPresensi, ubahStatusKegiatan } from "@/features/kegiatan/actions";
import { statusKegiatan } from "@/features/kegiatan/kartu-kegiatan";
import { LangkahKegiatan } from "@/features/kegiatan/langkah-kegiatan";
import { MateriEditor } from "@/features/kegiatan/materi-editor";
import { PresensiCepat } from "@/features/kegiatan/presensi-cepat";
import { ambilKegiatan, daftarSurat, kitabAktif, pesertaKegiatan } from "@/features/kegiatan/queries";
import { requirePeran } from "@/lib/auth/session";
import { formatJam, formatRentangJam, formatTanggal, LABEL_PRESENSI, labelKelasKegiatan, URUTAN_PRESENSI } from "@/lib/format";

export const metadata: Metadata = { title: "Kegiatan · Pantau Generus" };

async function Isi({ params }: { params: Promise<{ id: string }> }) {
  await requirePeran("admin", "guru", "pengurus", "wali");
  const { id } = await params;
  const k = await ambilKegiatan(id);
  if (!k) notFound();

  const kelasIds = k.kegiatan_kelas.map((x) => x.kelas_id);
  const [peserta, kitab, surat] = await Promise.all([pesertaKegiatan(k.id, kelasIds), kitabAktif(), daftarSurat()]);
  const r = k.ringkas;
  const status = statusKegiatan(r);
  const bisa = k.bolehKelola && k.status !== "batal";
  const sudahPresensi = peserta.some((p) => p.status);
  const jumlah = Object.fromEntries(URUTAN_PRESENSI.map((s) => [s, peserta.filter((p) => p.status === s).length]));

  const materi = bisa ? (
    <MateriEditor
      kitab={kitab}
      surat={surat}
      awal={k.materi.map((m) => ({
        kitab_id: m.kitab_id!,
        jenis: m.jenis!,
        mulai: m.mulai!,
        selesai: m.selesai!,
        mulai_surat: m.mulai_surat,
        mulai_ayat: m.mulai_ayat,
        selesai_surat: m.selesai_surat,
        selesai_ayat: m.selesai_ayat,
      }))}
      rundownAwal={k.rundown}
      action={simpanMateri.bind(null, k.id)}
    />
  ) : (
    <Kartu className="flex flex-col gap-3">
      {k.materi.length === 0 ? (
        <p className="text-muted-foreground">Belum ada materi yang dicatat.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {k.materi.map((m) => (
            <li key={m.id} className="rounded-xl bg-mint px-4 py-3 text-mint-foreground">
              <span className="block font-semibold">
                {m.kitab_nama} · {m.jenis === "bacaan" ? "Bacaan" : "Makna"}
              </span>
              {m.teks}
            </li>
          ))}
        </ul>
      )}
      {k.rundown.length > 0 && (
        <ol className="flex flex-col gap-1 border-t pt-3">
          {k.rundown.map((x) => (
            <li key={x.urutan}>
              <span className="tabular-nums text-muted-foreground">{formatJam(x.waktu) || "—"}</span> {x.aktivitas}
            </li>
          ))}
        </ol>
      )}
    </Kartu>
  );

  const kehadiran = (
    <PresensiCepat peserta={peserta} kelas={r.kelas} action={simpanPresensi.bind(null, k.id)} bisaUbah={bisa} />
  );

  const selesai = (
    <Kartu className="flex flex-col gap-4">
      <dl className="grid gap-3 sm:grid-cols-2">
        <div>
          <dt className="font-semibold">Materi</dt>
          <dd className="text-muted-foreground">
            {k.materi.length ? k.materi.map((m) => `${m.kitab_nama}: ${m.teks}`).join(" · ") : "Belum diisi"}
          </dd>
        </div>
        <div>
          <dt className="font-semibold">Kehadiran</dt>
          <dd className="text-muted-foreground">
            {sudahPresensi
              ? URUTAN_PRESENSI.map((s) => `${LABEL_PRESENSI[s]} ${jumlah[s]}`).join(" · ")
              : "Belum diisi"}
          </dd>
        </div>
      </dl>
      {k.catatan && <p className="rounded-xl bg-muted px-4 py-3">{k.catatan}</p>}

      {k.bolehKelola && (
        <div className="flex flex-col gap-2 lg:flex-row lg:flex-wrap">
          {k.status === "terjadwal" && (
            <form action={aturStatusKegiatan.bind(null, k.id, "selesai")}>
              <Button type="submit" size="lg" className="w-full lg:w-auto">
                <CheckCheck aria-hidden />
                Tandai Selesai
              </Button>
            </form>
          )}
          {k.status !== "terjadwal" && (
            <form action={aturStatusKegiatan.bind(null, k.id, "terjadwal")}>
              <Button type="submit" variant="outline" size="lg" className="w-full lg:w-auto">
                <RotateCcw aria-hidden />
                {k.status === "batal" ? "Batalkan libur" : "Buka kembali"}
              </Button>
            </form>
          )}
          {k.status === "terjadwal" && (
            <TombolHapus
              action={ubahStatusKegiatan.bind(null, k.id, "batal")}
              judul="Liburkan kegiatan ini?"
              keterangan="Kegiatan ditandai libur dan tidak dihitung dalam progres maupun kehadiran. Bisa dibatalkan kapan saja."
              label="Liburkan"
              ikon={<CalendarX2 aria-hidden />}
              variant="outline"
            />
          )}
        </div>
      )}
    </Kartu>
  );

  return (
    <>
      <header className="flex flex-col gap-2 border-b bg-card px-2 pt-3 pb-4 lg:border-0 lg:bg-transparent lg:p-0">
        <BackLink href={`/hari-ini?tanggal=${k.tanggal}`} label="Pengajian" className="text-primary" />
        <div className="flex flex-wrap items-start justify-between gap-3 px-2 lg:px-0">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold">{labelKelasKegiatan(r.kelas)}</h1>
            {k.judul && <p className="text-lg">{k.judul}</p>}
            <p className="text-muted-foreground">
              {formatTanggal(k.tanggal)}
              {k.jam_mulai && ` · ${formatRentangJam(k.jam_mulai, k.jam_selesai)}`}
              {" · "}
              {r.pengajar.length ? r.pengajar.join(", ") : "Pengajar belum diisi"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusChip nada={status.nada} simbol={status.simbol}>
              {status.label}
            </StatusChip>
            {k.bolehKelola && (
              <Button asChild variant="outline">
                <Link href={`/kegiatan/${k.id}/ubah`}>
                  <Pencil aria-hidden />
                  Ubah info
                </Link>
              </Button>
            )}
          </div>
        </div>
        {k.status === "batal" && (
          <p className="mx-2 rounded-xl bg-muted px-4 py-3 lg:mx-0">Kegiatan ini ditandai <strong>libur</strong>. Materi dan kehadiran tidak bisa diisi.</p>
        )}
      </header>

      <LangkahKegiatan
        materi={materi}
        kehadiran={kehadiran}
        selesai={selesai}
        sudah={{ materi: k.materi.length > 0, kehadiran: sudahPresensi, selesai: k.status === "selesai" }}
      />
    </>
  );
}

export default function KegiatanPage({ params }: PageProps<"/kegiatan/[id]">) {
  return (
    <Halaman>
      <Suspense fallback={<SkeletonDaftar baris={4} />}>
        <Isi params={params} />
      </Suspense>
    </Halaman>
  );
}
