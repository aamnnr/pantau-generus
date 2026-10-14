import type { Metadata } from "next";
import { Suspense } from "react";
import { Halaman, Kosong, Konten, PageHeader, SkeletonDaftar } from "@/components/page";
import { hapusJilid, simpanJilid } from "@/features/tilawati/actions";
import { BarisJilid, TambahJilid } from "@/features/tilawati/jilid-form";
import { requirePeran } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Jilid Tilawati · Pantau Generus" };

async function Daftar() {
  const { peran } = await requirePeran("admin", "pengurus");
  const admin = peran.includes("admin");
  const supabase = await createClient();
  const { data, error } = await supabase.from("jilid_tilawati").select("id, jilid, total_halaman").order("jilid");
  if (error) throw error;
  const berikut = (data.at(-1)?.jilid ?? 0) + 1;

  return (
    <Konten>
      <p className="text-muted-foreground">
        Jumlah halaman tiap jilid dipakai untuk menawarkan <strong className="text-foreground">naik jilid</strong> saat
        mencatat tilawati anak Caberawit.
      </p>
      {data.length === 0 && !admin && <Kosong judul="Belum ada data jilid" />}
      <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
        {data.map((j) => (
          <BarisJilid
            key={j.id}
            jilid={j.jilid}
            totalHalaman={j.total_halaman}
            action={simpanJilid.bind(null, j.id)}
            hapus={hapusJilid.bind(null, j.id)}
            bisaUbah={admin}
          />
        ))}
      </div>
      {admin && <TambahJilid action={simpanJilid.bind(null, null)} jilidBerikut={berikut} />}
    </Konten>
  );
}

export default function TilawatiPage() {
  return (
    <Halaman lebar="form">
      <PageHeader title="Jilid Tilawati" subtitle="Untuk Caberawit" back={{ href: "/lainnya", label: "Lainnya" }} />
      <Suspense fallback={<SkeletonDaftar baris={3} />}>
        <Daftar />
      </Suspense>
    </Halaman>
  );
}
