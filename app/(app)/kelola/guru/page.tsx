import { ChevronRight, KeyRound, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Halaman, Kosong, Konten, PageHeader, SkeletonDaftar } from "@/components/page";
import { StatusChip } from "@/components/status-chip";
import { Button } from "@/components/ui/button";
import { daftarGuru } from "@/features/guru/queries";
import { requirePeran } from "@/lib/auth/session";
import { formatNoHp, inisial, labelKelas } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Guru · Pantau Generus" };

async function Daftar() {
  const { peran } = await requirePeran("admin", "pengurus");
  const admin = peran.includes("admin");
  const guru = await daftarGuru();

  if (guru.length === 0) {
    return (
      <Konten>
        <Kosong judul="Belum ada data guru" keterangan="Tambahkan guru ngaji beserta kelas yang diajar. Guru tidak wajib punya akun." />
      </Konten>
    );
  }

  return (
    <Konten>
      <ul className="berurutan grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-3">
        {guru.map((g) => {
          const isi = (
            <>
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-mint text-sm font-bold text-mint-foreground">
                {inisial(g.nama)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 text-lg font-medium">
                  <span className="truncate">{g.nama}</span>
                  {g.profil_id && <KeyRound aria-label="Punya akun" className="size-4 shrink-0 text-primary" />}
                </span>
                <span className="block truncate text-muted-foreground">
                  {g.kelas.length ? g.kelas.map(labelKelas).join(", ") : "Belum ada kelas"}
                </span>
                {g.no_hp && <span className="block text-muted-foreground">{formatNoHp(g.no_hp)}</span>}
              </span>
              {!g.aktif && (
                <StatusChip nada="abu" simbol="○">
                  Nonaktif
                </StatusChip>
              )}
              {admin && <ChevronRight aria-hidden className="size-6 shrink-0 text-muted-foreground" />}
            </>
          );
          const kartu = "flex min-h-16 items-center gap-3.5 rounded-2xl bg-card px-3.5 py-3 border";
          return (
            <li key={g.id}>
              {admin ? (
                <Link href={`/kelola/guru/${g.id}`} className={cn(kartu, "transition-colors hover:border-primary/40 hover:bg-mint/40")}>
                  {isi}
                </Link>
              ) : (
                <div className={kartu}>{isi}</div>
              )}
            </li>
          );
        })}
      </ul>
    </Konten>
  );
}

async function TombolTambah() {
  const { peran } = await requirePeran("admin", "pengurus");
  if (!peran.includes("admin")) return null;
  return (
    <Button asChild size="lg">
      <Link href="/kelola/guru/baru">
        <Plus aria-hidden />
        Tambah Guru
      </Link>
    </Button>
  );
}

export default function GuruPage() {
  return (
    <Halaman>
      <PageHeader
        title="Guru"
        subtitle="Guru ngaji dan kelas yang diajar"
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
