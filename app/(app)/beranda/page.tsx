import { CalendarCheck2, ChevronRight, CircleAlert, CircleCheck, UsersRound } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { Halaman, JudulKartu, Kartu, Kerangka, Konten, PageHeader } from "@/components/page";
import { CincinProgres } from "@/components/progres";
import { KotakAngka } from "@/components/stat";
import { StatusChip } from "@/components/status-chip";
import { capaianTargetBerjalan, kehadiranHarian, perluPerhatian } from "@/features/beranda/queries";
import { KartuKegiatan, statusKegiatan } from "@/features/kegiatan/kartu-kegiatan";
import { kegiatanTanggal, kelasUntukKegiatan } from "@/features/kegiatan/queries";
import { daftarKelas } from "@/features/kelas/queries";
import { getSession } from "@/lib/auth/session";
import { bacaFilterKelas, PilihKelasFilter } from "@/features/beranda/filter-kelas";
import { formatHariSingkat, formatTanggal, geserTanggal, hariIni, LABEL_JENJANG, labelKelas } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Beranda · Pantau Generus" };

/** Kelas yang dirangkum: guru → kelas yang diajar; admin & pengurus → semua kelas aktif yang berisi anak. */
async function kelasRingkasan() {
  const s = await getSession();
  if (s.mode === "guru") return kelasUntukKegiatan(s.userId, false);
  return (await daftarKelas({ hanyaAktif: true })).filter((k) => k.jumlahAnak > 0);
}

/** Pilihan filter kehadiran: semua kelas aktif (guru: kelas yang diajar), meski belum berisi anak. */
async function kelasFilter() {
  const s = await getSession();
  if (s.mode === "guru") return kelasUntukKegiatan(s.userId, false);
  return daftarKelas({ hanyaAktif: true });
}

async function Sapaan() {
  const { nama, mode } = await getSession();
  // Wali punya halaman sendiri (Anakku).
  if (mode === "wali") redirect("/anakku");
  return <>Assalamu&apos;alaikum, {nama.split(" ")[0]}</>;
}

async function Tanggal() {
  await connection();
  return <>{formatTanggal(hariIni())} · Ringkasan pengajian & capaian</>;
}

async function HariIni() {
  await connection();
  const kegiatan = await kegiatanTanggal(hariIni());
  const aktif = kegiatan.filter((k) => k.status !== "batal");
  const belumList = aktif.filter((k) => statusKegiatan(k).label === "Belum diisi");
  return (
    <>
      <div className="grid grid-cols-3 gap-2.5 lg:gap-3">
        <KotakAngka ikon={CalendarCheck2} nilai={aktif.length} label="Pengajian hari ini" />
        <KotakAngka ikon={CircleCheck} nilai={aktif.length - belumList.length} label="Sudah diisi" nada="biru" />
        <KotakAngka ikon={CircleAlert} nilai={belumList.length} label="Belum diisi" nada={belumList.length ? "oranye" : "abu"} />
      </div>
      <Kartu className="flex flex-col gap-3">
        <JudulKartu aksi={<TautanKecil href="/hari-ini">Semua pengajian</TautanKecil>}>Perlu diisi hari ini</JudulKartu>
        {aktif.length === 0 ? (
          <p className="text-base text-muted-foreground">Tidak ada pengajian terjadwal hari ini.</p>
        ) : belumList.length === 0 ? (
          <p className="flex items-center gap-2 rounded-xl bg-ok-soft px-3.5 py-2.5 text-base text-ok">
            <CircleCheck aria-hidden className="size-[18px]" /> Alhamdulillah, semua pengajian hari ini sudah diisi.
          </p>
        ) : (
          <ul className="berurutan grid grid-cols-1 gap-2.5 md:grid-cols-2">
            {belumList.map((k) => (
              <li key={k.id}>
                <KartuKegiatan k={k} />
              </li>
            ))}
          </ul>
        )}
      </Kartu>
    </>
  );
}

type Cari = { jenjang?: string; kelas?: string };

async function GrafikKehadiran({ searchParams }: { searchParams: Promise<Cari> }) {
  await connection();
  const hari = hariIni();
  const [cari, kelas] = await Promise.all([searchParams, kelasFilter()]);
  const filter = bacaFilterKelas(cari, kelas);
  const data = await kehadiranHarian(geserTanggal(hari, -6), hari, filter.kelasIds);
  const judul = filter.kelas ? labelKelas(filter.kelas) : filter.jenjang ? LABEL_JENJANG[filter.jenjang] : null;
  const hadir = data.reduce((n, d) => n + d.hadir, 0);
  const total = data.reduce((n, d) => n + d.total, 0);
  return (
    <Kartu className="flex flex-col gap-4">
      <JudulKartu aksi={<span className="text-sm text-muted-foreground">7 hari terakhir</span>}>
        Kehadiran{judul && <span className="font-medium text-muted-foreground"> · {judul}</span>}
      </JudulKartu>
      <PilihKelasFilter base="/beranda" kelas={kelas} filter={filter} />
      <p className="flex items-baseline gap-2">
        <span className="text-3xl font-bold tabular-nums">{total ? `${Math.round((100 * hadir) / total)}%` : "—"}</span>
        <span className="text-sm text-muted-foreground">{total ? `hadir · ${hadir} dari ${total} catatan` : "Belum ada presensi"}</span>
      </p>
      <ol className="grid h-36 grid-cols-7 items-end gap-2" aria-label="Kehadiran per hari">
        {data.map((d, i) => (
          <li key={d.tanggal} className="flex h-full flex-col items-center justify-end gap-1.5">
            <span className="relative flex w-full max-w-9 flex-1 items-end overflow-hidden rounded-lg bg-secondary">
              {d.persen != null && (
                <span
                  className={cn("w-full origin-bottom animate-tumbuh rounded-lg", d.persen < 60 ? "bg-kunyit/80" : "bg-primary")}
                  style={{ height: `${Math.max(d.persen, 6)}%`, animationDelay: `${i * 40}ms` }}
                  title={`${formatTanggal(d.tanggal)}: ${d.persen}% (${d.hadir}/${d.total})`}
                />
              )}
            </span>
            <span className={cn("text-xs", d.tanggal === hari ? "font-semibold text-primary" : "text-muted-foreground")}>
              {formatHariSingkat(d.tanggal)}
            </span>
            <span className="sr-only">{d.persen == null ? "tidak ada pengajian" : `${d.persen}% hadir`}</span>
          </li>
        ))}
      </ol>
      <p className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden className="size-2.5 rounded-sm bg-primary" /> ≥ 60%
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden className="size-2.5 rounded-sm bg-kunyit/80" /> di bawah 60%
        </span>
      </p>
    </Kartu>
  );
}

async function TargetBerjalan() {
  await connection();
  const daftar = await capaianTargetBerjalan(await kelasRingkasan(), hariIni());
  return (
    <Kartu className="flex flex-col gap-3">
      <JudulKartu aksi={<TautanKecil href="/target">Target</TautanKecil>}>Target berjalan</JudulKartu>
      {daftar.length === 0 ? (
        <p className="text-base text-muted-foreground">Belum ada target untuk periode ini.</p>
      ) : (
        <ul className="berurutan flex flex-col divide-y">
          {daftar.map((x) => (
            <li key={x.kelas.id}>
              <Link href={`/target/${x.target.id}`} className="flex items-center gap-3 py-2.5 hover:text-primary">
                <CincinProgres nilai={x.rata_target} ukuran={48} tebal={5} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{labelKelas(x.kelas)}</span>
                  <span className="block truncate text-sm text-muted-foreground">
                    {x.target.judul}
                    {x.rata_ketuntasan != null && ` · materi diikuti ${x.rata_ketuntasan}%`}
                  </span>
                </span>
                <ChevronRight aria-hidden className="size-4 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-muted-foreground">Lingkaran = rata-rata butir target yang sudah tuntas.</p>
    </Kartu>
  );
}

async function PerluPerhatian() {
  await connection();
  const hari = hariIni();
  const daftar = await perluPerhatian(await kelasRingkasan(), `${hari.slice(0, 8)}01`, hari);
  return (
    <Kartu className="flex flex-col gap-3">
      <JudulKartu aksi={<TautanKecil href="/rekap">Rekap</TautanKecil>}>Perlu perhatian</JudulKartu>
      <p className="-mt-1 text-sm text-muted-foreground">Kehadiran bulan ini di bawah ambang.</p>
      {daftar.length === 0 ? (
        <p className="flex items-center gap-2 rounded-xl bg-ok-soft px-3.5 py-2.5 text-base text-ok">
          <CircleCheck aria-hidden className="size-[18px]" /> Tidak ada anak yang perlu perhatian.
        </p>
      ) : (
        <ul className="berurutan flex flex-col gap-1.5">
          {daftar.slice(0, 6).map((a) => (
            <li key={a.generus_id}>
              <Link
                href={`/generus/${a.generus_id}`}
                className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-muted"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{a.nama}</span>
                  <span className="block text-sm text-muted-foreground">{labelKelas(a.kelas)}</span>
                </span>
                <StatusChip nada="merah" simbol="!">
                  {a.persen}%
                </StatusChip>
              </Link>
            </li>
          ))}
          {daftar.length > 6 && (
            <li>
              <TautanKecil href="/rekap">dan {daftar.length - 6} anak lainnya</TautanKecil>
            </li>
          )}
        </ul>
      )}
    </Kartu>
  );
}

function TautanKecil({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex h-8 items-center gap-0.5 rounded-lg px-2 text-sm font-semibold text-primary hover:bg-mint">
      {children}
      <ChevronRight aria-hidden className="size-4" />
    </Link>
  );
}

export default function BerandaPage({ searchParams }: PageProps<"/beranda">) {
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
            <Tanggal />
          </Suspense>
        }
      />
      <Konten>
        <Suspense
          fallback={
            <>
              <div className="grid grid-cols-3 gap-2.5">
                {[0, 1, 2].map((i) => (
                  <Kerangka key={i} className="h-17" />
                ))}
              </div>
              <Kerangka className="h-32" />
            </>
          }
        >
          <HariIni />
        </Suspense>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:items-start">
          <div className="lg:col-span-2">
            <Suspense fallback={<Kerangka className="h-64" />}>
              <GrafikKehadiran searchParams={searchParams as Promise<Cari>} />
            </Suspense>
          </div>
          <Suspense fallback={<Kerangka className="h-64" />}>
            <PerluPerhatian />
          </Suspense>
        </div>
        <Suspense fallback={<Kerangka className="h-48" />}>
          <TargetBerjalan />
        </Suspense>
        <p className="flex items-center gap-2 pb-2 text-sm text-muted-foreground">
          <UsersRound aria-hidden className="size-4" />
          Angka dihitung dari presensi & penilaian yang sudah tercatat.
        </p>
      </Konten>
    </Halaman>
  );
}
