import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Halaman, PageHeader, SkeletonDaftar } from "@/components/page";
import { Button } from "@/components/ui/button";
import { DaftarAkun } from "@/features/akun/daftar-akun";
import { daftarAkun } from "@/features/akun/queries";
import { requirePeran } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Akun & Wali · Pantau Generus" };

async function Isi() {
  const { peran } = await requirePeran("admin", "pengurus");
  return <DaftarAkun data={await daftarAkun()} bisaUbah={peran.includes("admin")} />;
}

async function TombolTambah() {
  const { peran } = await requirePeran("admin", "pengurus");
  if (!peran.includes("admin")) return null;
  return (
    <Button asChild size="lg">
      <Link href="/kelola/akun/baru">
        <Plus aria-hidden />
        Buat Akun
      </Link>
    </Button>
  );
}

export default function AkunPage() {
  return (
    <Halaman>
      <PageHeader
        title="Akun & Wali"
        subtitle="Akun masuk untuk admin, guru, pengurus, dan wali"
        back={{ href: "/lainnya", label: "Lainnya" }}
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
