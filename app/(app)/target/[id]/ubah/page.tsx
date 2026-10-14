import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { FormHeader, Halaman, Kartu, Konten } from "@/components/page";
import { TombolHapus } from "@/components/tombol-hapus";
import { kelasUntukKegiatan } from "@/features/kegiatan/queries";
import { hapusTarget, ubahInfoTarget } from "@/features/target/actions";
import { ambilTarget } from "@/features/target/queries";
import { TargetForm } from "@/features/target/target-form";
import { requirePeran } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Ubah Target · Pantau Generus" };

async function Form({ params }: { params: Promise<{ id: string }> }) {
  const session = await requirePeran("admin", "guru");
  const { id } = await params;
  const [t, kelasPilihan] = await Promise.all([ambilTarget(id), kelasUntukKegiatan(session.userId, session.peran.includes("admin"))]);
  if (!t) notFound();
  if (!t.boleh_kelola) redirect(`/target/${id}`);

  // Kelas target yang tidak diajar guru tetap ditampilkan agar tidak terlepas tanpa sengaja.
  const kelas = [...kelasPilihan, ...t.kelas.filter((k) => !kelasPilihan.some((p) => p.id === k.id))];

  return (
    <TargetForm
      action={ubahInfoTarget.bind(null, t.id)}
      awal={{
        judul: t.judul,
        semester: t.semester ?? "",
        mulai: t.mulai,
        selesai: t.selesai,
        kelas: t.kelas.map((k) => k.id),
        catatan: t.catatan ?? "",
        salin_dari: "",
      }}
      kelas={kelas}
      labelSimpan="Simpan Info Target"
      hapus={
        <TombolHapus
          action={hapusTarget.bind(null, t.id)}
          judul={`Hapus target ${t.judul}?`}
          keterangan="Seluruh isi target ini ikut terhapus. Kegiatan dan kehadiran tidak terpengaruh."
        />
      }
    />
  );
}

export default function UbahTargetPage({ params }: PageProps<"/target/[id]/ubah">) {
  return (
    <Suspense fallback={null}>
      <Isi params={params} />
    </Suspense>
  );
}

async function Isi({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Halaman lebar="form">
      <FormHeader title="Ubah Info Target" back={{ href: `/target/${id}` }} />
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
