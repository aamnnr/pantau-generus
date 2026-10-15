import type { Metadata } from "next";
import { Suspense } from "react";
import { FormHeader, Halaman, Kartu, Konten } from "@/components/page";
import { kelasUntukKegiatan } from "@/features/kegiatan/queries";
import { buatTarget } from "@/features/target/actions";
import { daftarTarget } from "@/features/target/queries";
import { TargetForm } from "@/features/target/target-form";
import { requirePeran } from "@/lib/auth/session";
import { geserTanggal, hariIni } from "@/lib/format";

export const metadata: Metadata = { title: "Buat Target · Pantau Generus" };

async function Form() {
  const session = await requirePeran("admin", "guru");
  const [kelas, target] = await Promise.all([
    kelasUntukKegiatan(session.userId, session.peran.includes("admin")),
    daftarTarget(),
  ]);
  // Default: periode berikutnya sesudah target terakhir; bila belum ada, mulai hari ini.
  const terakhir = target[0];
  const mulai = terakhir ? geserTanggal(terakhir.selesai, 1) : hariIni();

  return (
    <TargetForm
      action={buatTarget}
      awal={{
        judul: "",
        semester: terakhir?.semester ?? "",
        rentang_usia: "",
        mulai,
        selesai: geserTanggal(mulai, 27),
        kelas: kelas.length === 1 ? [kelas[0].id] : (terakhir?.kelas.map((k) => k.id).filter((id) => kelas.some((x) => x.id === id)) ?? []),
        catatan: "",
        salin_dari: "",
      }}
      kelas={kelas}
      sumberSalin={target.slice(0, 6)}
      labelSimpan="Buat Target"
    />
  );
}

export default function TargetBaruPage() {
  return (
    <Halaman lebar="form">
      <FormHeader
        title="Buat Target"
        subtitle="Isi info periode dulu. Setelah itu Anda diarahkan ke isi target (bacaan, makna, dan butir materi)."
        back={{ href: "/target" }}
      />
      <Konten>
        <Kartu>
          <Suspense fallback={null}>
            <Form />
          </Suspense>
        </Kartu>
      </Konten>
    </Halaman>
  );
}
