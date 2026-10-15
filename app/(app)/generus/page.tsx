import { ClipboardCheck, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Halaman, PageHeader, SkeletonDaftar } from "@/components/page";
import { Button } from "@/components/ui/button";
import { naikKelas } from "@/features/generus/actions";
import { DaftarGenerus } from "@/features/generus/daftar-generus";
import { daftarGenerus } from "@/features/generus/queries";
import { daftarKelas } from "@/features/kelas/queries";
import { requirePeran } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Generus · Pantau Generus" };

async function Isi() {
  const session = await requirePeran("admin", "guru", "pengurus");
  const [data, kelas] = await Promise.all([daftarGenerus(), daftarKelas()]);
  return <DaftarGenerus data={data} kelas={kelas} bisaUbah={session.peran.includes("admin")} naikKelas={naikKelas} />;
}

async function Judul() {
  const { mode } = await requirePeran("admin", "guru", "pengurus");
  return <>{mode === "guru" ? "Anak di kelas yang Anda ajar" : "Anak binaan kelompok"}</>;
}

async function TombolTambah() {
  const { peran } = await requirePeran("admin", "guru", "pengurus");
  return (
    <>
      {(peran.includes("admin") || peran.includes("guru")) && (
        <Button asChild size="lg" variant="outline" className="border-brand-foreground/60 bg-transparent text-brand-foreground lg:border-input lg:bg-card lg:text-foreground">
          <Link href="/penilaian">
            <ClipboardCheck aria-hidden />
            Penilaian
          </Link>
        </Button>
      )}
      {peran.includes("admin") && (
        <Button asChild size="lg" className="bg-kunyit text-kunyit-foreground hover:bg-kunyit/85 lg:bg-primary lg:text-primary-foreground lg:hover:bg-primary/85">
          <Link href="/generus/baru">
            <Plus aria-hidden />
            Tambah Generus
          </Link>
        </Button>
      )}
    </>
  );
}

export default function GenerusPage() {
  return (
    <Halaman>
      <PageHeader
        title="Generus"
        subtitle={
          <Suspense fallback={<span className="opacity-0">.</span>}>
            <Judul />
          </Suspense>
        }
        actions={
          <Suspense fallback={null}>
            <TombolTambah />
          </Suspense>
        }
      />
      <Suspense fallback={<SkeletonDaftar />}>
        <Isi />
      </Suspense>
    </Halaman>
  );
}
