import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { FormHeader, Halaman, Kartu, Konten } from "@/components/page";
import { TombolHapus } from "@/components/tombol-hapus";
import { hapusGenerus, simpanGenerus } from "@/features/generus/actions";
import { GenerusForm } from "@/features/generus/generus-form";
import { ambilGenerus, daftarAkunWali } from "@/features/generus/queries";
import { daftarKelas } from "@/features/kelas/queries";
import { requirePeran } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Ubah Generus · Pantau Generus" };

async function Form({ params }: { params: Promise<{ id: string }> }) {
  await requirePeran("admin");
  const { id } = await params;
  const [g, kelas, akunWali] = await Promise.all([ambilGenerus(id), daftarKelas(), daftarAkunWali()]);
  if (!g) notFound();

  return (
    <GenerusForm
      action={simpanGenerus.bind(null, g.id)}
      awal={{
        nama: g.nama,
        jenis_kelamin: g.jenis_kelamin,
        tanggal_lahir: g.tanggal_lahir ?? "",
        kelas_id: g.kelas_id,
        status: g.status,
        wali: g.generus_wali.map((w) => w.profil_id),
        hubungan: g.generus_wali.map((w) => w.hubungan ?? "Wali"),
      }}
      kelas={kelas}
      akunWali={akunWali}
      ubah
      hapus={
        <TombolHapus
          action={hapusGenerus.bind(null, g.id)}
          judul={`Hapus data ${g.nama}?`}
          keterangan="Seluruh kehadiran, penilaian, dan riwayat anak ini ikut terhapus. Bila anak sudah lulus atau pindah, cukup ubah statusnya."
        />
      }
    />
  );
}

export default function UbahGenerusPage({ params }: PageProps<"/generus/[id]/ubah">) {
  return (
    <Halaman lebar="form">
      <FormHeader title="Ubah Generus" back={{ href: "/generus" }} />
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
