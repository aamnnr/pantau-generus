import type { Metadata } from "next";
import { Suspense } from "react";
import { FormHeader, Halaman, Kartu, Konten } from "@/components/page";
import { simpanGuru } from "@/features/guru/actions";
import { GuruForm } from "@/features/guru/guru-form";
import { daftarKelas } from "@/features/kelas/queries";
import { requirePeran } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Tambah Guru · Pantau Generus" };

async function Form() {
  await requirePeran("admin");
  return (
    <GuruForm
      action={simpanGuru.bind(null, null)}
      awal={{ nama: "", no_hp: "", kelas: [], aktif: "ya" }}
      kelas={await daftarKelas()}
      punyaAkun={false}
    />
  );
}

export default function GuruBaruPage() {
  return (
    <Halaman lebar="form">
      <FormHeader title="Tambah Guru" back={{ href: "/kelola/guru" }} />
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
