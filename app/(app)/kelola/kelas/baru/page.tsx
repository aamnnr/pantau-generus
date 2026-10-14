import type { Metadata } from "next";
import { Suspense } from "react";
import { FormHeader, Halaman, Kartu, Konten } from "@/components/page";
import { simpanKelas } from "@/features/kelas/actions";
import { KelasForm } from "@/features/kelas/kelas-form";
import { requirePeran } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Tambah Kelas · Pantau Generus" };

async function Form() {
  await requirePeran("admin");
  return <KelasForm action={simpanKelas.bind(null, null)} awal={{ jenjang: "", nama: "", urutan: 0, aktif: "ya" }} />;
}

export default function KelasBaruPage() {
  return (
    <Halaman lebar="form">
      <FormHeader title="Tambah Kelas" back={{ href: "/kelola/kelas" }} />
      <Konten>
        <Kartu>
          <Suspense fallback={null}>
            <Form />
          </Suspense>
        </Kartu>
      </Konten>
    </Halaman>
  );
}
