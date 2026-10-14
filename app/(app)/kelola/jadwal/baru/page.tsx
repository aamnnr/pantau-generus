import type { Metadata } from "next";
import { Suspense } from "react";
import { FormHeader, Halaman, Kartu, Konten } from "@/components/page";
import { simpanJadwal } from "@/features/jadwal/actions";
import { JadwalForm } from "@/features/jadwal/jadwal-form";
import { daftarGuru } from "@/features/guru/queries";
import { daftarKelas } from "@/features/kelas/queries";
import { requirePeran } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Tambah Jadwal · Pantau Generus" };

async function Form() {
  await requirePeran("admin");
  const [kelas, guru] = await Promise.all([daftarKelas(), daftarGuru()]);
  return (
    <JadwalForm
      action={simpanJadwal.bind(null, null)}
      awal={{ hari: "", jam_mulai: "", jam_selesai: "", kelas: [], guru_id: "", aktif: "ya" }}
      kelas={kelas}
      guru={guru.filter((g) => g.aktif)}
    />
  );
}

export default function JadwalBaruPage() {
  return (
    <Halaman lebar="form">
      <FormHeader title="Tambah Jadwal Rutin" back={{ href: "/kelola/jadwal" }} />
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
