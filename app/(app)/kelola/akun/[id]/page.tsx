import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { FormHeader, Halaman, Kartu, Konten } from "@/components/page";
import { TombolHapus } from "@/components/tombol-hapus";
import { hapusAkun, resetPin, ubahAkun } from "@/features/akun/actions";
import { AkunForm, ResetPinForm } from "@/features/akun/akun-form";
import { ambilAkun } from "@/features/akun/queries";
import { requirePeran } from "@/lib/auth/session";
import { formatNoHp } from "@/lib/format";

export const metadata: Metadata = { title: "Ubah Akun · Pantau Generus" };

async function Isi({ params }: { params: Promise<{ id: string }> }) {
  const session = await requirePeran("admin");
  const { id } = await params;
  const akun = await ambilAkun(id);
  if (!akun) notFound();
  const diriSendiri = akun.id === session.userId;

  return (
    <>
      <Kartu>
        <AkunForm
          action={ubahAkun.bind(null, akun.id)}
          awal={{ nama: akun.nama, no_hp: formatNoHp(akun.no_hp), peran: akun.profil_peran.map((p) => p.peran) }}
          baru={false}
          hapus={
            !diriSendiri && (
              <TombolHapus
                action={hapusAkun.bind(null, akun.id)}
                judul={`Hapus akun ${akun.nama}?`}
                keterangan="Pemilik akun tidak bisa masuk lagi. Data anak dan kegiatan tidak ikut terhapus."
              />
            )
          }
        />
      </Kartu>

      {akun.generus_wali.length > 0 && (
        <Kartu className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold">Anak yang diwalikan</h2>
          <ul className="flex flex-col gap-2">
            {akun.generus_wali.map((w) =>
              w.generus ? (
                <li key={w.generus.id}>
                  <Link href={`/generus/${w.generus.id}/ubah`} className="flex min-h-10 items-center justify-between rounded-xl bg-mint px-4 font-medium text-mint-foreground">
                    {w.generus.nama}
                    <span className="text-base font-normal">{w.hubungan ?? "Wali"}</span>
                  </Link>
                </li>
              ) : null,
            )}
          </ul>
        </Kartu>
      )}

      <Kartu className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">Ganti PIN</h2>
        <p className="text-muted-foreground">Gunakan bila pemilik akun lupa PIN.</p>
        <ResetPinForm action={resetPin.bind(null, akun.id)} />
      </Kartu>
    </>
  );
}

export default function UbahAkunPage({ params }: PageProps<"/kelola/akun/[id]">) {
  return (
    <Halaman lebar="form">
      <FormHeader title="Ubah Akun" back={{ href: "/kelola/akun" }} />
      <Konten>
        <Suspense fallback={null}>
          <Isi params={params} />
        </Suspense>
      </Konten>
    </Halaman>
  );
}
