import { BookOpenText, ChevronRight, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Halaman, JudulKelompok, Kosong, Konten, PageHeader, SkeletonDaftar } from "@/components/page";
import { StatusChip } from "@/components/status-chip";
import { Button } from "@/components/ui/button";
import { daftarKitab } from "@/features/kitab/queries";
import { requirePeran } from "@/lib/auth/session";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Kitab · Pantau Generus" };

const angka = new Intl.NumberFormat("id-ID");
const kartu = "flex min-h-19 items-center gap-3.5 rounded-2xl bg-card px-3.5 py-3 shadow-[0_1px_2px_rgba(18,20,19,0.06)]";

async function Daftar() {
  const { peran } = await requirePeran("admin", "pengurus");
  const admin = peran.includes("admin");
  const kitab = await daftarKitab();
  const quran = kitab.filter((k) => k.jenis === "quran");
  const hadist = kitab.filter((k) => k.jenis === "hadist");

  return (
    <Konten>
      <JudulKelompok>Al-Qur&apos;an</JudulKelompok>
      {quran.map((k) => (
        <div key={k.id} className={cn(kartu, "bg-mint")}>
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand text-brand-foreground">
            <BookOpenText aria-hidden className="size-6" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-lg font-medium">{k.nama}</span>
            <span className="block text-muted-foreground">114 surat · {angka.format(k.total_satuan)} ayat · progres per ayat</span>
          </span>
        </div>
      ))}

      <JudulKelompok>Al-Hadist</JudulKelompok>
      {hadist.length === 0 ? (
        <Kosong judul="Belum ada kitab Al-Hadist" keterangan="Tambahkan kitab yang dimaknai beserta jumlah halamannya." />
      ) : (
        <ul className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-3">
          {hadist.map((k) => {
            const isi = (
              <>
                <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-mint text-mint-foreground">
                  <BookOpenText aria-hidden className="size-6" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-lg font-medium">{k.nama}</span>
                  <span className="block text-muted-foreground">{angka.format(k.total_satuan)} halaman</span>
                </span>
                {!k.aktif && (
                  <StatusChip nada="abu" simbol="○">
                    Nonaktif
                  </StatusChip>
                )}
                {admin && <ChevronRight aria-hidden className="size-6 shrink-0 text-muted-foreground" />}
              </>
            );
            return (
              <li key={k.id}>
                {admin ? (
                  <Link href={`/kelola/kitab/${k.id}`} className={cn(kartu, "hover:bg-mint/60")}>
                    {isi}
                  </Link>
                ) : (
                  <div className={kartu}>{isi}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Konten>
  );
}

async function TombolTambah() {
  const { peran } = await requirePeran("admin", "pengurus");
  if (!peran.includes("admin")) return null;
  return (
    <Button asChild size="lg" className="bg-kunyit text-kunyit-foreground hover:bg-kunyit/85 lg:bg-primary lg:text-primary-foreground lg:hover:bg-primary/85">
      <Link href="/kelola/kitab/baru">
        <Plus aria-hidden />
        Tambah Kitab
      </Link>
    </Button>
  );
}

export default function KitabPage() {
  return (
    <Halaman>
      <PageHeader
        title="Kitab"
        subtitle="Sumber materi makna & bacaan"
        back={{ href: "/lainnya", label: "Lainnya" }}
        actions={
          <Suspense fallback={null}>
            <TombolTambah />
          </Suspense>
        }
      />
      <Suspense fallback={<SkeletonDaftar baris={3} />}>
        <Daftar />
      </Suspense>
    </Halaman>
  );
}
