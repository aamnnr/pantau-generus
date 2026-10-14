import type { Metadata } from "next";
import { Suspense } from "react";
import { FormHeader, Halaman, Kartu, Konten } from "@/components/page";
import { buatAkun } from "@/features/akun/actions";
import { AkunForm } from "@/features/akun/akun-form";
import { requirePeran } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Buat Akun · Pantau Generus" };

async function Form() {
  await requirePeran("admin");
  return <AkunForm action={buatAkun} awal={{ nama: "", no_hp: "", peran: [] }} baru />;
}

export default function AkunBaruPage() {
  return (
    <Halaman lebar="form">
      <FormHeader
        title="Buat Akun"
        subtitle="Untuk wali: buat akun di sini, lalu hubungkan ke anaknya dari formulir Generus."
        back={{ href: "/kelola/akun" }}
      />
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
