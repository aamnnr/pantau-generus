import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { FormHeader, Halaman, Kartu, Konten } from "@/components/page";
import { TombolHapus } from "@/components/tombol-hapus";
import { daftarGuru } from "@/features/guru/queries";
import { hapusKegiatan, ubahKegiatan } from "@/features/kegiatan/actions";
import { KegiatanForm } from "@/features/kegiatan/kegiatan-form";
import { ambilKegiatan, kelasUntukKegiatan } from "@/features/kegiatan/queries";
import { requirePeran } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Ubah Kegiatan · Pantau Generus" };

async function Form({ params }: { params: Promise<{ id: string }> }) {
  const session = await requirePeran("admin", "guru");
  const { id } = await params;
  const [k, kelasPilihan, guru] = await Promise.all([
    ambilKegiatan(id),
    kelasUntukKegiatan(session.userId, session.peran.includes("admin")),
    daftarGuru(),
  ]);
  if (!k) notFound();
  if (!k.bolehKelola) redirect(`/kegiatan/${id}`);

  // Kelas kegiatan yang tidak diajar guru tetap ditampilkan agar tidak terlepas tanpa sengaja.
  const kelasIds = k.kegiatan_kelas.map((x) => x.kelas_id);
  const kelas = [...kelasPilihan, ...k.ringkas.kelas.filter((x) => !kelasPilihan.some((p) => p.id === x.id))];
  const pengajarIds = k.kegiatan_pengajar.map((x) => x.guru_id);

  return (
    <KegiatanForm
      action={ubahKegiatan.bind(null, k.id)}
      awal={{
        tanggal: k.tanggal,
        jam_mulai: k.jam_mulai ?? "",
        jam_selesai: k.jam_selesai ?? "",
        judul: k.judul ?? "",
        kelas: kelasIds,
        pengajar: pengajarIds,
        catatan: k.catatan ?? "",
      }}
      kelas={kelas}
      guru={guru.filter((g) => g.aktif || pengajarIds.includes(g.id))}
      labelSimpan="Simpan Info Kegiatan"
      hapus={
        k.jenis === "khusus" && (
          <TombolHapus
            action={hapusKegiatan.bind(null, k.id, k.tanggal)}
            judul="Hapus kegiatan ini?"
            keterangan="Materi dan kehadiran kegiatan ini ikut terhapus. Bila kegiatan tidak jadi dilaksanakan, cukup tandai Libur."
          />
        )
      }
    />
  );
}

export default function UbahKegiatanPage({ params }: PageProps<"/kegiatan/[id]/ubah">) {
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
      <FormHeader title="Ubah Info Kegiatan" back={{ href: `/kegiatan/${id}` }} />
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
