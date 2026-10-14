import type { Metadata } from "next";
import { Suspense } from "react";
import { FormHeader, Halaman, Kartu, Konten } from "@/components/page";
import { daftarGuru } from "@/features/guru/queries";
import { buatKegiatan } from "@/features/kegiatan/actions";
import { KegiatanForm } from "@/features/kegiatan/kegiatan-form";
import { kelasUntukKegiatan } from "@/features/kegiatan/queries";
import { requirePeran } from "@/lib/auth/session";
import { hariIni } from "@/lib/format";

export const metadata: Metadata = { title: "Tambah Kegiatan · Pantau Generus" };

type SP = Promise<{ tanggal?: string }>;

async function Form({ searchParams }: { searchParams: SP }) {
  const session = await requirePeran("admin", "guru");
  const { tanggal } = await searchParams;
  const [kelas, guru] = await Promise.all([
    kelasUntukKegiatan(session.userId, session.peran.includes("admin")),
    daftarGuru(),
  ]);
  const aktif = guru.filter((g) => g.aktif);
  // Guru yang membuat kegiatan otomatis menjadi pengajar.
  const diriSendiri = guru.find((g) => g.profil_id === session.userId);

  return (
    <KegiatanForm
      action={buatKegiatan}
      awal={{
        tanggal: tanggal && /^\d{4}-\d{2}-\d{2}$/.test(tanggal) ? tanggal : hariIni(),
        jam_mulai: "",
        jam_selesai: "",
        judul: "",
        kelas: kelas.length === 1 ? [kelas[0].id] : [],
        pengajar: diriSendiri ? [diriSendiri.id] : [],
        catatan: "",
      }}
      kelas={kelas}
      guru={aktif}
      labelSimpan="Buat Kegiatan"
    />
  );
}

export default function KegiatanBaruPage({ searchParams }: PageProps<"/kegiatan/baru">) {
  return (
    <Halaman lebar="form">
      <FormHeader title="Tambah Kegiatan" subtitle="Pengajian di luar jadwal rutin, mis. pengajian umum gabungan." back={{ href: "/hari-ini" }} />
      <Konten>
        <Kartu>
          <Suspense fallback={null}>
            <Form searchParams={searchParams as SP} />
          </Suspense>
        </Kartu>
      </Konten>
    </Halaman>
  );
}
