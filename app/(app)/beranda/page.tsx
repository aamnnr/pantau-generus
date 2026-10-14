import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { SegeraHadir } from "@/components/segera-hadir";
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Beranda · Pantau Generus" };

/** Titik masuk setelah login: arahkan ke halaman utama sesuai mode (DESIGN §5). */
async function Arahkan() {
  const { mode } = await getSession();
  if (mode === "admin" || mode === "guru") redirect("/hari-ini");
  if (mode === "wali") redirect("/anakku");
  return <SegeraHadir judul="Beranda" tahap={6} isi="Ringkasan kehadiran & capaian semua kelas untuk pengurus." />;
}

export default function BerandaPage() {
  return (
    <Suspense fallback={null}>
      <Arahkan />
    </Suspense>
  );
}
