import { ChevronRight, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Halaman, JudulKelompok, Kosong, Konten, PageHeader, SkeletonDaftar } from "@/components/page";
import { StatusChip } from "@/components/status-chip";
import { Button } from "@/components/ui/button";
import { daftarMateri } from "@/features/materi/queries";
import { requirePeran } from "@/lib/auth/session";
import { LABEL_ASPEK, LABEL_JENJANG, URUTAN_ASPEK, type Aspek } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Materi · Pantau Generus" };

async function Daftar({ searchParams }: { searchParams: Promise<{ aspek?: string }> }) {
  const { peran } = await requirePeran("admin", "pengurus", "guru");
  const bisaUbah = peran.includes("admin") || peran.includes("guru"); // guru ikut mengelola materi (PRD §4)
  const { aspek: q } = await searchParams;
  const aspek: Aspek = URUTAN_ASPEK.includes(q as Aspek) ? (q as Aspek) : "alim";
  const semua = await daftarMateri();
  const materi = semua.filter((m) => m.aspek === aspek);
  const mapel = [...new Set(materi.map((m) => m.mapel))];

  return (
    <Konten>
      <nav aria-label="Pilih aspek" className="grid grid-cols-2 gap-1 rounded-2xl bg-secondary p-1 sm:grid-cols-4">
        {URUTAN_ASPEK.map((a) => {
          const jumlah = semua.filter((m) => m.aspek === a).length;
          return (
            <Link
              key={a}
              href={`/kelola/materi?aspek=${a}`}
              aria-current={a === aspek ? "page" : undefined}
              className={cn(
                "flex min-h-12 items-center justify-center rounded-xl px-2 text-center text-base leading-tight font-medium text-[#444444]",
                a === aspek && "bg-card font-semibold text-primary shadow-sm",
              )}
            >
              {LABEL_ASPEK[a]} ({jumlah})
            </Link>
          );
        })}
      </nav>

      {materi.length === 0 ? (
        <Kosong
          judul={`Belum ada materi ${LABEL_ASPEK[aspek]}`}
          keterangan="Isi butir materi sesuai dokumen target dari tim kurikulum PPG."
          aksi={
            bisaUbah && (
              <Button asChild size="lg">
                <Link href={`/kelola/materi/baru?aspek=${aspek}`}>Tambah Materi</Link>
              </Button>
            )
          }
        />
      ) : (
        mapel.map((mp) => (
          <section key={mp} className="flex flex-col gap-2.5">
            <JudulKelompok>{mp}</JudulKelompok>
            <ul className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
              {materi
                .filter((m) => m.mapel === mp)
                .map((m) => {
                  const isi = (
                    <>
                      <span className="min-w-0 flex-1">
                        <span className="block text-lg font-medium">{m.nama}</span>
                        {m.keterangan && <span className="line-clamp-2 block text-muted-foreground">{m.keterangan}</span>}
                        <span className="mt-1 flex flex-wrap gap-1.5">
                          {m.jenjang && (
                            <StatusChip nada="biru">{LABEL_JENJANG[m.jenjang]}</StatusChip>
                          )}
                          {m.jenis_kelamin && (
                            <StatusChip nada="ungu">{m.jenis_kelamin === "laki_laki" ? "Putra" : "Putri"}</StatusChip>
                          )}
                          {!m.aktif && (
                            <StatusChip nada="abu" simbol="○">
                              Nonaktif
                            </StatusChip>
                          )}
                        </span>
                      </span>
                      {bisaUbah && <ChevronRight aria-hidden className="size-6 shrink-0 text-muted-foreground" />}
                    </>
                  );
                  const kartu = "flex min-h-16 items-center gap-3 rounded-2xl bg-card px-4 py-3 shadow-[0_1px_2px_rgba(18,20,19,0.06)]";
                  return (
                    <li key={m.id}>
                      {bisaUbah ? (
                        <Link href={`/kelola/materi/${m.id}`} className={cn(kartu, "hover:bg-mint/60")}>
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
        ))
      )}
    </Konten>
  );
}

async function TombolTambah({ searchParams }: { searchParams: Promise<{ aspek?: string }> }) {
  const { peran } = await requirePeran("admin", "pengurus", "guru");
  if (!peran.includes("admin") && !peran.includes("guru")) return null;
  const { aspek } = await searchParams;
  return (
    <Button asChild size="lg" className="bg-kunyit text-kunyit-foreground hover:bg-kunyit/85 lg:bg-primary lg:text-primary-foreground lg:hover:bg-primary/85">
      <Link href={`/kelola/materi/baru${aspek ? `?aspek=${aspek}` : ""}`}>
        <Plus aria-hidden />
        Tambah Materi
      </Link>
    </Button>
  );
}

export default function MateriPage({ searchParams }: PageProps<"/kelola/materi">) {
  const sp = searchParams as Promise<{ aspek?: string }>;
  return (
    <Halaman>
      <PageHeader
        title="Materi"
        subtitle="Butir materi per aspek & mapel (format PPG)"
        back={{ href: "/lainnya", label: "Lainnya" }}
        actions={
          <Suspense fallback={null}>
            <TombolTambah searchParams={sp} />
          </Suspense>
        }
      />
      <Suspense fallback={<SkeletonDaftar />}>
        <Daftar searchParams={sp} />
      </Suspense>
    </Halaman>
  );
}
