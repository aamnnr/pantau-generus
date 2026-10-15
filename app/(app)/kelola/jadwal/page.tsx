import { ChevronRight, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Halaman, JudulKelompok, Kosong, Konten, PageHeader, SkeletonDaftar } from "@/components/page";
import { StatusChip } from "@/components/status-chip";
import { Button } from "@/components/ui/button";
import { daftarJadwal } from "@/features/jadwal/queries";
import { requirePeran } from "@/lib/auth/session";
import { formatRentangJam, LABEL_HARI, labelKelasKegiatan } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Jadwal Rutin · Pantau Generus" };

async function Daftar() {
  const { peran } = await requirePeran("admin", "pengurus");
  const admin = peran.includes("admin");
  const jadwal = await daftarJadwal();

  if (jadwal.length === 0) {
    return (
      <Konten>
        <Kosong
          judul="Belum ada jadwal rutin"
          keterangan="Atur pola pengajian mingguan per kelas. Kegiatan akan disiapkan otomatis di halaman Pengajian Hari Ini."
          aksi={
            admin && (
              <Button asChild size="lg">
                <Link href="/kelola/jadwal/baru">Tambah Jadwal</Link>
              </Button>
            )
          }
        />
      </Konten>
    );
  }

  const hariAda = [...new Set(jadwal.map((j) => j.hari))];
  return (
    <Konten>
      {hariAda.map((h) => (
        <section key={h} className="flex flex-col gap-2.5">
          <JudulKelompok>{LABEL_HARI[h]}</JudulKelompok>
          <ul className="berurutan grid grid-cols-1 gap-2.5 md:grid-cols-2">
            {jadwal
              .filter((j) => j.hari === h)
              .map((j) => {
                const isi = (
                  <>
                    <span className="flex min-w-18 shrink-0 flex-col items-center justify-center rounded-xl bg-mint px-2 py-2 text-mint-foreground">
                      <span className="text-lg leading-tight font-bold tabular-nums">{formatRentangJam(j.jam_mulai, null)}</span>
                      {j.jam_selesai && <span className="text-base leading-tight tabular-nums">s.d. {formatRentangJam(j.jam_selesai, null)}</span>}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-lg font-medium">{labelKelasKegiatan(j.kelas)}</span>
                      <span className="block text-muted-foreground">{j.guru?.nama ?? "Guru belum ditentukan"}</span>
                    </span>
                    {!j.aktif && (
                      <StatusChip nada="abu" simbol="○">
                        Nonaktif
                      </StatusChip>
                    )}
                    {admin && <ChevronRight aria-hidden className="size-6 shrink-0 text-muted-foreground" />}
                  </>
                );
                const kartu = "flex min-h-16 items-center gap-3.5 rounded-2xl bg-card px-3.5 py-3 border";
                return (
                  <li key={j.id}>
                    {admin ? (
                      <Link href={`/kelola/jadwal/${j.id}`} className={cn(kartu, "transition-colors hover:border-primary/40 hover:bg-mint/40")}>
                        {isi}
                      </Link>
                    ) : (
                      <div className={kartu}>{isi}</div>
                    )}
                  </li>
                );
              })}
          </ul>
        </section>
      ))}
    </Konten>
  );
}

async function TombolTambah() {
  const { peran } = await requirePeran("admin", "pengurus");
  if (!peran.includes("admin")) return null;
  return (
    <Button asChild size="lg">
      <Link href="/kelola/jadwal/baru">
        <Plus aria-hidden />
        Tambah Jadwal
      </Link>
    </Button>
  );
}

export default function JadwalPage() {
  return (
    <Halaman>
      <PageHeader
        title="Jadwal Rutin"
        subtitle="Pola pengajian mingguan per kelas"
        back={{ href: "/lainnya", label: "Lainnya" }}
        actions={
          <Suspense fallback={null}>
            <TombolTambah />
          </Suspense>
        }
      />
      <Suspense fallback={<SkeletonDaftar />}>
        <Daftar />
      </Suspense>
    </Halaman>
  );
}
