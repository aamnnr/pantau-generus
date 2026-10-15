import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { FormHeader, Halaman, Kartu, Konten } from "@/components/page";
import type { RentangAwal } from "@/components/rentang-kitab";
import { ambilGenerus } from "@/features/generus/queries";
import { daftarSurat, kitabAktif } from "@/features/kegiatan/queries";
import { simpanSusulan } from "@/features/progres/actions";
import { SusulanForm } from "@/features/progres/susulan-form";
import { requirePeran } from "@/lib/auth/session";
import { hariIni } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Catat Susulan · Pantau Generus" };

type Cari = { kitab?: string; jenis?: string; mulai?: string; selesai?: string };

/** Isian awal dari tautan "Catat susulan" pada materi terlewat; Al-Qur'an dikonversi ke surat:ayat di SQL. */
async function rentangAwal(cari: Cari, kitab: { id: string; jenis: string }[]): Promise<RentangAwal | null> {
  const k = kitab.find((x) => x.id === cari.kitab);
  const mulai = Number(cari.mulai);
  const selesai = Number(cari.selesai);
  if (!k || !Number.isInteger(mulai) || !Number.isInteger(selesai)) return null;
  const jenis = cari.jenis === "bacaan" && k.jenis === "quran" ? "bacaan" : "makna";
  if (k.jenis !== "quran") {
    return { kitab_id: k.id, jenis, mulai, selesai, mulai_surat: null, mulai_ayat: null, selesai_surat: null, selesai_ayat: null };
  }
  const supabase = await createClient();
  type SuratAyat = { surat: number; ayat: number } | null;
  const [{ data: a }, { data: b }] = (await Promise.all([
    supabase.rpc("fn_surat_ayat", { p_global: mulai }).maybeSingle(),
    supabase.rpc("fn_surat_ayat", { p_global: selesai }).maybeSingle(),
  ])) as { data: SuratAyat }[];
  if (!a || !b) return null;
  return { kitab_id: k.id, jenis, mulai, selesai, mulai_surat: a.surat, mulai_ayat: a.ayat, selesai_surat: b.surat, selesai_ayat: b.ayat };
}

async function Isi({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Cari> }) {
  await requirePeran("admin", "guru");
  const [{ id }, cari] = await Promise.all([params, searchParams]);
  const supabase = await createClient();
  const [g, kitab, surat, { data: boleh }] = await Promise.all([
    ambilGenerus(id),
    kitabAktif(),
    daftarSurat(),
    supabase.rpc("boleh_nilai_generus", { p_generus_id: id }),
  ]);
  if (!g) notFound();
  if (!boleh) redirect(`/generus/${id}`);

  return (
    <Halaman lebar="form">
      <FormHeader
        title="Catat Susulan"
        subtitle={`${g.nama} — materi yang sudah dikejar di luar pengajian. Progres anak ikut bertambah.`}
        back={{ href: `/generus/${id}`, label: g.nama }}
      />
      <Konten>
        <Kartu>
          <SusulanForm
            kitab={kitab}
            surat={surat}
            awal={await rentangAwal(cari, kitab)}
            tanggal={hariIni()}
            action={simpanSusulan.bind(null, id)}
          />
        </Kartu>
      </Konten>
    </Halaman>
  );
}

export default function SusulanPage({ params, searchParams }: PageProps<"/generus/[id]/susulan">) {
  return (
    <Suspense fallback={null}>
      <Isi params={params} searchParams={searchParams as Promise<Cari>} />
    </Suspense>
  );
}
