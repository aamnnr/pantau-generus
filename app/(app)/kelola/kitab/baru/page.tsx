import type { Metadata } from "next";
import { Suspense } from "react";
import { FormHeader, Halaman, Kartu, Konten } from "@/components/page";
import { simpanKitab } from "@/features/kitab/actions";
import { KitabForm } from "@/features/kitab/kitab-form";
import { requirePeran } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Tambah Kitab · Pantau Generus" };

async function Form() {
  await requirePeran("admin");
  return <KitabForm action={simpanKitab.bind(null, null)} awal={{ nama: "", total_satuan: "", urutan: "0", aktif: "ya" }} />;
}

export default function KitabBaruPage() {
  return (
    <Halaman lebar="form">
      <FormHeader title="Tambah Kitab Al-Hadist" back={{ href: "/kelola/kitab" }} />
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
