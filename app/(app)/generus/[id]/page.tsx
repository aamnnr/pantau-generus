import { ClipboardCheck, Pencil, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BackLink, Halaman, Kartu, SkeletonDaftar } from "@/components/page";
import { BarProgres, formatAngka } from "@/components/progres";
import { CHIP_PRESENSI, StatusChip } from "@/components/status-chip";
import { TombolHapus } from "@/components/tombol-hapus";
import { Button } from "@/components/ui/button";
import { hapusSusulan, simpanPenilaian } from "@/features/progres/actions";
import { DaftarPenilaian } from "@/features/progres/daftar-penilaian";
import { ambilProgresAnak, type ProgresAnak } from "@/features/progres/queries";
import { TilawatiCepat } from "@/features/progres/tilawati-cepat";
import { daftarJilid } from "@/features/target/queries";
import { requirePeran } from "@/lib/auth/session";
import {
  formatTanggalPendek,
  inisial,
  LABEL_PRESENSI,
  labelKelas,
  teksPosisiTilawati,
  URUTAN_PRESENSI,
} from "@/lib/format";

export const metadata: Metadata = { title: "Progres Anak · Pantau Generus" };

const satuanDari = (kitabJenis: string | null) => (kitabJenis === "quran" ? "ayat" : "hal.");

async function Isi({ params }: { params: Promise<{ id: string }> }) {
  const session = await requirePeran("admin", "guru", "pengurus", "wali");
  const { id } = await params;
  const d = await ambilProgresAnak(id);
  if (!d) notFound();
  const caberawit = d.anak.kelas?.jenjang === "caberawit";
  const jilid = caberawit ? await daftarJilid() : [];
  const kembali = session.mode === "wali" ? { href: "/anakku", label: "Anakku" } : { href: "/generus", label: "Generus" };

  return (
    <>
      <header className="flex flex-col gap-2 border-b bg-card px-2 pt-3 pb-4 lg:border-0 lg:bg-transparent lg:p-0">
        <BackLink {...kembali} className="text-primary" />
        <div className="flex flex-wrap items-center justify-between gap-3 px-2 lg:px-0">
          <div className="flex min-w-0 items-center gap-3.5">
            <span aria-hidden className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-mint text-xl font-bold text-mint-foreground">
              {inisial(d.anak.nama)}
            </span>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold">{d.anak.nama}</h1>
              <p className="text-lg text-muted-foreground">{d.anak.kelas ? labelKelas(d.anak.kelas) : "Tanpa kelas"}</p>
            </div>
          </div>
          {session.peran.includes("admin") && (
            <Button asChild variant="outline">
              <Link href={`/generus/${id}/ubah`}>
                <Pencil aria-hidden />
                Ubah data
              </Link>
            </Button>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 px-4 lg:grid-cols-2 lg:items-start lg:px-0">
        <div className="flex flex-col gap-4">
          <KartuKehadiran k={d.kehadiran} />
          {d.target && <KartuTarget d={d} />}
          <KartuMakna d={d} />
        </div>
        <div className="flex flex-col gap-4">
          <Kartu className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xl font-bold">Hafalan, kefahaman & akhlaq</h2>
            </div>
            {d.materi.length ? (
              <DaftarPenilaian baris={d.materi} action={simpanPenilaian} bisa={d.bolehNilai} perAspek />
            ) : (
              <p className="text-muted-foreground">
                Belum ada butir materi. Butir muncul dari target periode ini atau dari materi yang disampaikan di pengajian.
              </p>
            )}
          </Kartu>
          {caberawit && (
            <Kartu className="flex flex-col gap-3">
              <h2 className="text-xl font-bold">Tilawati</h2>
              <TilawatiCepat baris={[{ generus_id: id, nama: d.anak.nama, posisi: d.tilawati && { jilid: d.tilawati.jilid!, halaman: d.tilawati.halaman!, total_halaman: d.tilawati.total_halaman } }]} jilid={jilid} bisa={d.bolehNilai} polos />
            </Kartu>
          )}
          {(d.susulan.length > 0 || d.bolehNilai) && <KartuSusulan d={d} id={id} />}
        </div>
      </div>
    </>
  );
}

function KartuKehadiran({ k }: { k: ProgresAnak["kehadiran"] }) {
  const b = k.bulanIni;
  const perhatian = b?.persen != null && b.persen < k.ambang;
  return (
    <Kartu className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-bold">Kehadiran bulan ini</h2>
        {perhatian && (
          <StatusChip nada="merah" simbol="!">
            Perlu perhatian
          </StatusChip>
        )}
      </div>
      {b && b.total > 0 ? (
        <>
          <p className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-primary tabular-nums">{b.persen}%</span>
            <span className="text-muted-foreground">hadir dari {b.total} pengajian</span>
          </p>
          <ul className="flex flex-wrap gap-2">
            {URUTAN_PRESENSI.filter((s) => b[s] > 0).map((s) => (
              <li key={s}>
                <StatusChip nada={CHIP_PRESENSI[s].nada} simbol={CHIP_PRESENSI[s].simbol}>
                  {LABEL_PRESENSI[s]} {b[s]}
                </StatusChip>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="text-muted-foreground">Belum ada kehadiran yang tercatat bulan ini.</p>
      )}
      {k.semua && k.semua.total > 0 && (
        <p className="border-t pt-3 text-muted-foreground">
          Sejak awal: <strong className="text-foreground">{k.semua.persen}%</strong> dari {k.semua.total} pengajian
        </p>
      )}
    </Kartu>
  );
}

function KartuTarget({ d }: { d: ProgresAnak }) {
  const t = d.target!;
  const materiTarget = d.materi.filter((m) => m.target);
  const tercapai = materiTarget.filter((m) => m.status === "lancar").length;
  const posisi = d.tilawati;
  const tilawatiTercapai =
    t.tilawati && posisi?.jilid != null &&
    (posisi.jilid > t.tilawati.jilid || (posisi.jilid === t.tilawati.jilid && (posisi.halaman ?? 0) >= t.tilawati.halaman));

  return (
    <Kartu className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-bold">Target {t.judul}</h2>
        <p className="text-muted-foreground">
          {formatTanggalPendek(t.mulai)} – {formatTanggalPendek(t.selesai)}
        </p>
      </div>
      {t.kitab.map((x) => (
        <BarProgres
          key={x.id}
          label={`${x.jenis === "bacaan" ? "Bacaan" : `Makna ${x.kitab_nama}`}: ${x.teks}`}
          nilai={x.diikuti}
          total={x.total}
          satuan={satuanDari(x.kitab_jenis)}
          pembanding={{ nilai: x.kelas, label: "Sudah disampaikan di kelas" }}
        />
      ))}
      {materiTarget.length > 0 && (
        <p>
          <span className="font-medium">Materi target:</span> {tercapai} dari {materiTarget.length} butir sudah tuntas
        </p>
      )}
      {t.tilawati && (
        <p>
          <span className="font-medium">Tilawati:</span> target {teksPosisiTilawati(t.tilawati)} · sekarang {teksPosisiTilawati(posisi)}
          {tilawatiTercapai && (
            <StatusChip nada="hijau" simbol="✓" className="ml-2">
              Tercapai
            </StatusChip>
          )}
        </p>
      )}
      {t.kitab.length === 0 && materiTarget.length === 0 && !t.tilawati && <p className="text-muted-foreground">Isi target belum diisi.</p>}
    </Kartu>
  );
}

function KartuMakna({ d }: { d: ProgresAnak }) {
  const id = d.anak.id;
  return (
    <Kartu className="flex flex-col gap-5">
      <h2 className="text-xl font-bold">Bacaan & makna</h2>
      {d.kitab.length === 0 && <p className="text-muted-foreground">Belum ada materi bacaan atau makna yang tercatat untuk kelas ini.</p>}
      {d.kitab.map((k) => {
        const satuan = satuanDari(k.kitab_jenis);
        const surat = k.kitab_jenis === "quran" ? (d.perSurat[k.jenis!] ?? []) : [];
        return (
          <section key={`${k.kitab_id}-${k.jenis}`} className="flex flex-col gap-3 border-t pt-4 first-of-type:border-0 first-of-type:pt-0">
            <h3 className="text-lg font-semibold">
              {k.jenis === "bacaan" ? `Bacaan ${k.kitab_nama}` : `Makna ${k.kitab_nama}`}
            </h3>
            {k.kitab_jenis === "quran" ? (
              // Persen terhadap 6.236 ayat hampir selalu 0%, jadi Al-Qur'an diringkas per surat (PRD F6 aturan 7).
              <p>
                <strong className="text-xl tabular-nums">{formatAngka(k.diikuti!)} ayat</strong>
                <span className="text-muted-foreground"> diikuti · kelas {formatAngka(k.kelas!)} ayat</span>
              </p>
            ) : (
              <BarProgres nilai={k.diikuti!} total={k.total!} satuan={satuan} pembanding={{ nilai: k.kelas!, label: "Kelas" }} />
            )}
            {surat.length > 0 && (
              <ul className="flex flex-col gap-2.5 rounded-xl bg-muted/60 p-3">
                {surat.map((s) => (
                  <li key={s.surat}>
                    <BarProgres kecil label={`${s.surat}. ${s.nama}`} nilai={s.diikuti!} total={s.jumlah_ayat!} satuan="ayat" />
                  </li>
                ))}
              </ul>
            )}
            {k.terlewat.length > 0 && (
              <div className="flex flex-col gap-2 rounded-xl bg-[#fff1de] p-3 text-[#5c3200]">
                <p className="font-semibold">Materi terlewat ({formatAngka(k.terlewat.reduce((n, r) => n + r.selesai - r.mulai + 1, 0))} {satuan})</p>
                <ul className="flex flex-col gap-1.5">
                  {k.terlewat.map((r) => (
                    <li key={r.mulai} className="flex flex-wrap items-center justify-between gap-2">
                      <span>{r.teks}</span>
                      {d.bolehNilai && (
                        <Button asChild variant="outline" size="sm" className="h-11 bg-card">
                          <Link href={`/generus/${id}/susulan?kitab=${k.kitab_id}&jenis=${k.jenis}&mulai=${r.mulai}&selesai=${r.selesai}`}>
                            <ClipboardCheck aria-hidden />
                            Catat susulan
                          </Link>
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        );
      })}
    </Kartu>
  );
}

function KartuSusulan({ d, id }: { d: ProgresAnak; id: string }) {
  return (
    <Kartu className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-bold">Susulan</h2>
        {d.bolehNilai && (
          <Button asChild variant="outline">
            <Link href={`/generus/${id}/susulan`}>
              <Plus aria-hidden />
              Catat susulan
            </Link>
          </Button>
        )}
      </div>
      {d.susulan.length === 0 ? (
        <p className="text-muted-foreground">Belum ada susulan. Materi yang dikejar di luar pengajian dicatat di sini agar progres anak ikut bertambah.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {d.susulan.map((s) => (
            <li key={s.id} className="flex flex-col gap-2 rounded-xl bg-muted/60 px-4 py-3 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <p className="font-medium">
                  {s.jenis === "bacaan" ? "Bacaan" : "Makna"} {s.kitab_nama}: {s.teks}
                </p>
                <p className="text-muted-foreground">
                  {formatTanggalPendek(s.tanggal!)}
                  {s.guru_nama && ` · ${s.guru_nama}`}
                </p>
              </div>
              {d.bolehNilai && (
                <TombolHapus
                  action={hapusSusulan.bind(null, id, s.id!)}
                  judul="Hapus catatan susulan ini?"
                  keterangan={`${s.kitab_nama}: ${s.teks}. Progres anak akan dihitung ulang.`}
                  variant="outline"
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </Kartu>
  );
}

export default function ProgresAnakPage({ params }: PageProps<"/generus/[id]">) {
  return (
    <Halaman>
      <Suspense fallback={<SkeletonDaftar baris={4} />}>
        <Isi params={params} />
      </Suspense>
    </Halaman>
  );
}
