import { ChevronRight, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Halaman, JudulKelompok, Kosong, Konten, PageHeader, SkeletonDaftar } from "@/components/page";
import { StatusChip } from "@/components/status-chip";
import { Button } from "@/components/ui/button";
import { daftarKelas } from "@/features/kelas/queries";
import { requirePeran } from "@/lib/auth/session";
import { LABEL_JENJANG, URUTAN_JENJANG } from "@/lib/format";

export const metadata: Metadata = { title: "Kelas · Pantau Generus" };

async function Daftar() {
  const session = await requirePeran("admin", "pengurus");
  const admin = session.peran.includes("admin");
  const kelas = await daftarKelas();

  if (kelas.length === 0) {
    return (
      <Konten>
        <Kosong
          judul="Belum ada kelas"
          keterangan="Mulai dengan menambahkan kelas, mis. TK, 1A–3B untuk Caberawit, Pra-remaja, Pelajar, dan Pra-nikah."
          aksi={admin && <Button asChild size="lg"><Link href="/kelola/kelas/baru">Tambah Kelas</Link></Button>}
        />
      </Konten>
    );
  }

  return (
    <Konten>
      {URUTAN_JENJANG.map((j) => {
        const isi = kelas.filter((k) => k.jenjang === j);
        if (isi.length === 0) return null;
        return (
          <section key={j} className="flex flex-col gap-2.5">
            <JudulKelompok>{LABEL_JENJANG[j]}</JudulKelompok>
            <ul className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-3">
              {isi.map((k) => {
                const isiKartu = (
                  <>
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-mint text-lg font-bold text-mint-foreground">
                      {k.nama.slice(0, 2)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-lg font-medium">{k.nama}</span>
                      <span className="block text-muted-foreground">{k.jumlahAnak} anak aktif</span>
                    </span>
                    {!k.aktif && <StatusChip nada="abu" simbol="○">Nonaktif</StatusChip>}
                    {admin && <ChevronRight aria-hidden className="size-6 shrink-0 text-muted-foreground" />}
                  </>
                );
                const kelasKartu = "flex min-h-19 items-center gap-3.5 rounded-2xl bg-card px-3.5 py-3 shadow-[0_1px_2px_rgba(18,20,19,0.06)]";
                return (
                  <li key={k.id}>
                    {admin ? (
                      <Link href={`/kelola/kelas/${k.id}`} className={`${kelasKartu} hover:bg-mint/60`}>
                        {isiKartu}
                      </Link>
                    ) : (
                      <div className={kelasKartu}>{isiKartu}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </Konten>
  );
}

async function TombolTambah() {
  const { peran } = await requirePeran("admin", "pengurus");
  if (!peran.includes("admin")) return null;
  return (
    <Button asChild variant="secondary" className="bg-kunyit text-kunyit-foreground hover:bg-kunyit/85 lg:bg-primary lg:text-primary-foreground lg:hover:bg-primary/85" size="lg">
      <Link href="/kelola/kelas/baru">
        <Plus aria-hidden />
        Tambah Kelas
      </Link>
    </Button>
  );
}

export default function KelasPage() {
  return (
    <Halaman>
      <PageHeader
        title="Kelas"
        subtitle="Pembagian kelas per jenjang"
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
