import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { FormHeader, Halaman, Kartu, Konten } from "@/components/page";
import { TombolHapus } from "@/components/tombol-hapus";
import { hapusMateri, simpanMateri } from "@/features/materi/actions";
import { MateriForm } from "@/features/materi/materi-form";
import { ambilMateri, daftarMapel } from "@/features/materi/queries";
import { requirePeran } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Ubah Materi · Pantau Generus" };

async function Form({ params }: { params: Promise<{ id: string }> }) {
  await requirePeran("admin", "guru");
  const { id } = await params;
  const [m, mapelTerpakai] = await Promise.all([ambilMateri(id), daftarMapel()]);
  if (!m) notFound();

  return (
    <MateriForm
      action={simpanMateri.bind(null, m.id)}
      awal={{
        aspek: m.aspek,
        mapel: m.mapel,
        nama: m.nama,
        keterangan: m.keterangan ?? "",
        jenjang: m.jenjang ?? "semua",
        jenis_kelamin: m.jenis_kelamin ?? "semua",
        urutan: String(m.urutan),
        aktif: m.aktif ? "ya" : "tidak",
      }}
      mapelTerpakai={mapelTerpakai}
      hapus={
        <TombolHapus
          action={hapusMateri.bind(null, m.id)}
          judul="Hapus materi ini?"
          keterangan="Bila materi sudah dipakai di target atau penilaian, ubah statusnya menjadi Nonaktif saja."
        />
      }
    />
  );
}

export default function UbahMateriPage({ params }: PageProps<"/kelola/materi/[id]">) {
  return (
    <Halaman lebar="form">
      <FormHeader title="Ubah Materi" back={{ href: "/kelola/materi" }} />
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
