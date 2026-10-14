import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { FormHeader, Halaman, Kartu, Konten } from "@/components/page";
import { TombolHapus } from "@/components/tombol-hapus";
import { hapusKitab, simpanKitab } from "@/features/kitab/actions";
import { KitabForm } from "@/features/kitab/kitab-form";
import { ambilKitab } from "@/features/kitab/queries";
import { requirePeran } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Ubah Kitab · Pantau Generus" };

async function Form({ params }: { params: Promise<{ id: string }> }) {
  await requirePeran("admin");
  const { id } = await params;
  const k = await ambilKitab(id);
  if (!k) notFound();

  return (
    <KitabForm
      action={simpanKitab.bind(null, k.id)}
      awal={{ nama: k.nama, total_satuan: String(k.total_satuan), urutan: String(k.urutan), aktif: k.aktif ? "ya" : "tidak" }}
      hapus={
        <TombolHapus
          action={hapusKitab.bind(null, k.id)}
          judul={`Hapus kitab ${k.nama}?`}
          keterangan="Bila kitab sudah dipakai di kegiatan atau target, ubah statusnya menjadi Nonaktif saja."
        />
      }
    />
  );
}

export default function UbahKitabPage({ params }: PageProps<"/kelola/kitab/[id]">) {
  return (
    <Halaman lebar="form">
      <FormHeader title="Ubah Kitab" back={{ href: "/kelola/kitab" }} />
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
