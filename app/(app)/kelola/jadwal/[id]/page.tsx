import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { FormHeader, Halaman, Kartu, Konten } from "@/components/page";
import { TombolHapus } from "@/components/tombol-hapus";
import { hapusJadwal, simpanJadwal } from "@/features/jadwal/actions";
import { JadwalForm } from "@/features/jadwal/jadwal-form";
import { ambilJadwal } from "@/features/jadwal/queries";
import { daftarGuru } from "@/features/guru/queries";
import { daftarKelas } from "@/features/kelas/queries";
import { requirePeran } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Ubah Jadwal · Pantau Generus" };

async function Form({ params }: { params: Promise<{ id: string }> }) {
  await requirePeran("admin");
  const { id } = await params;
  const [j, kelas, guru] = await Promise.all([ambilJadwal(id), daftarKelas(), daftarGuru()]);
  if (!j) notFound();

  return (
    <JadwalForm
      action={simpanJadwal.bind(null, j.id)}
      awal={{
        hari: String(j.hari),
        jam_mulai: j.jam_mulai,
        jam_selesai: j.jam_selesai ?? "",
        kelas: j.jadwal_rutin_kelas.map((k) => k.kelas_id),
        guru_id: j.guru_id ?? "",
        aktif: j.aktif ? "ya" : "tidak",
      }}
      kelas={kelas}
      guru={guru.filter((g) => g.aktif || g.id === j.guru_id)}
      hapus={
        <TombolHapus
          action={hapusJadwal.bind(null, j.id)}
          judul="Hapus jadwal ini?"
          keterangan="Kegiatan yang sudah tercatat tetap tersimpan. Bila hanya libur sementara, ubah statusnya menjadi Nonaktif."
        />
      }
    />
  );
}

export default function UbahJadwalPage({ params }: PageProps<"/kelola/jadwal/[id]">) {
  return (
    <Halaman lebar="form">
      <FormHeader title="Ubah Jadwal Rutin" back={{ href: "/kelola/jadwal" }} />
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
