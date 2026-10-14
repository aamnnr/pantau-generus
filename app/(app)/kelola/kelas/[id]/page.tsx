import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { FormHeader, Halaman, Kartu, Konten } from "@/components/page";
import { TombolHapus } from "@/components/tombol-hapus";
import { hapusKelas, simpanKelas } from "@/features/kelas/actions";
import { KelasForm } from "@/features/kelas/kelas-form";
import { ambilKelas } from "@/features/kelas/queries";
import { requirePeran } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Ubah Kelas · Pantau Generus" };

async function Form({ params }: { params: Promise<{ id: string }> }) {
  await requirePeran("admin");
  const { id } = await params;
  const kelas = await ambilKelas(id);
  if (!kelas) notFound();

  return (
    <KelasForm
      action={simpanKelas.bind(null, kelas.id)}
      awal={{ jenjang: kelas.jenjang, nama: kelas.nama, urutan: kelas.urutan, aktif: kelas.aktif ? "ya" : "tidak" }}
      hapus={
        <TombolHapus
          action={hapusKelas.bind(null, kelas.id)}
          judul={`Hapus kelas ${kelas.nama}?`}
          keterangan="Kelas hanya bisa dihapus bila belum punya anak maupun kegiatan. Bila sudah dipakai, ubah statusnya menjadi Nonaktif."
        />
      }
    />
  );
}

export default function UbahKelasPage({ params }: PageProps<"/kelola/kelas/[id]">) {
  return (
    <Halaman lebar="form">
      <FormHeader title="Ubah Kelas" back={{ href: "/kelola/kelas" }} />
      <Konten>
        <Kartu>
          <Suspense fallback={null}>
            <Form params={params} />
          </Suspense>
        </Kartu>
      </Konten>
    </Halaman>
  );
}
