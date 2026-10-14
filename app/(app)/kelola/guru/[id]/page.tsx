import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { FormHeader, Halaman, Kartu, Konten } from "@/components/page";
import { TombolHapus } from "@/components/tombol-hapus";
import { hapusGuru, simpanGuru } from "@/features/guru/actions";
import { GuruForm } from "@/features/guru/guru-form";
import { ambilGuru } from "@/features/guru/queries";
import { daftarKelas } from "@/features/kelas/queries";
import { requirePeran } from "@/lib/auth/session";
import { formatNoHp } from "@/lib/format";

export const metadata: Metadata = { title: "Ubah Guru · Pantau Generus" };

async function Form({ params }: { params: Promise<{ id: string }> }) {
  await requirePeran("admin");
  const { id } = await params;
  const [g, kelas] = await Promise.all([ambilGuru(id), daftarKelas()]);
  if (!g) notFound();

  return (
    <GuruForm
      action={simpanGuru.bind(null, g.id)}
      awal={{ nama: g.nama, no_hp: formatNoHp(g.no_hp), kelas: g.guru_kelas.map((k) => k.kelas_id), aktif: g.aktif ? "ya" : "tidak" }}
      kelas={kelas}
      punyaAkun={!!g.profil_id}
      hapus={
        <TombolHapus
          action={hapusGuru.bind(null, g.id)}
          judul={`Hapus guru ${g.nama}?`}
          keterangan="Bila guru sudah tercatat mengajar di kegiatan, ubah statusnya menjadi Nonaktif saja."
        />
      }
    />
  );
}

export default function UbahGuruPage({ params }: PageProps<"/kelola/guru/[id]">) {
  return (
    <Halaman lebar="form">
      <FormHeader title="Ubah Guru" back={{ href: "/kelola/guru" }} />
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
