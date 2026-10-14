import type { Metadata } from "next";
import { Suspense } from "react";
import { FormHeader, Halaman, Kartu, Konten } from "@/components/page";
import { simpanMateri } from "@/features/materi/actions";
import { MateriForm } from "@/features/materi/materi-form";
import { daftarMapel } from "@/features/materi/queries";
import { requirePeran } from "@/lib/auth/session";
import { URUTAN_ASPEK, type Aspek } from "@/lib/format";

export const metadata: Metadata = { title: "Tambah Materi · Pantau Generus" };

async function Form({ searchParams }: { searchParams: Promise<{ aspek?: string }> }) {
  await requirePeran("admin");
  const { aspek } = await searchParams;
  return (
    <MateriForm
      action={simpanMateri.bind(null, null)}
      awal={{
        aspek: URUTAN_ASPEK.includes(aspek as Aspek) ? (aspek as string) : "",
        mapel: "",
        nama: "",
        keterangan: "",
        jenjang: "semua",
        jenis_kelamin: "semua",
        urutan: "0",
        aktif: "ya",
      }}
      mapelTerpakai={await daftarMapel()}
    />
  );
}

export default function MateriBaruPage({ searchParams }: PageProps<"/kelola/materi/baru">) {
  return (
    <Halaman lebar="form">
      <FormHeader title="Tambah Materi" back={{ href: "/kelola/materi" }} />
      <Konten>
        <Kartu>
          <Suspense fallback={null}>
            <Form searchParams={searchParams as Promise<{ aspek?: string }>} />
          </Suspense>
        </Kartu>
      </Konten>
    </Halaman>
  );
}
