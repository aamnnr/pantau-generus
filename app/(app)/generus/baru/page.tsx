import type { Metadata } from "next";
import { Suspense } from "react";
import { FormHeader, Halaman, Kartu, Konten } from "@/components/page";
import { simpanGenerus } from "@/features/generus/actions";
import { GenerusForm } from "@/features/generus/generus-form";
import { daftarAkunWali } from "@/features/generus/queries";
import { daftarKelas } from "@/features/kelas/queries";
import { requirePeran } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Tambah Generus · Pantau Generus" };

async function Form() {
  await requirePeran("admin");
  const [kelas, akunWali] = await Promise.all([daftarKelas(), daftarAkunWali()]);
  return (
    <GenerusForm
      action={simpanGenerus.bind(null, null)}
      awal={{ nama: "", jenis_kelamin: "", tanggal_lahir: "", kelas_id: "", status: "aktif", wali: [], hubungan: [] }}
      kelas={kelas}
      akunWali={akunWali}
      ubah={false}
    />
  );
}

export default function GenerusBaruPage() {
  return (
    <Halaman lebar="form">
      <FormHeader title="Tambah Generus" back={{ href: "/generus" }} />
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
