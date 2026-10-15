import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Beranda · Pantau Generus" };

/** Titik masuk setelah login: arahkan ke halaman utama sesuai mode (DESIGN §5). */
async function Arahkan(): Promise<React.ReactNode> {
  const { mode } = await getSession();
  if (mode === "admin" || mode === "guru") redirect("/hari-ini");
  if (mode === "wali") redirect("/anakku");
  redirect("/rekap");
}

export default function BerandaPage() {
  return (
    <Suspense fallback={null}>
      <Arahkan />
    </Suspense>
  );
}
