import type { Metadata } from "next";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { keluar } from "@/features/auth/actions";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Beranda · Pantau Generus" };

const LABEL_PERAN = { admin: "Admin", guru: "Guru", pengurus: "Pengurus", wali: "Wali" } as const;

async function Sapaan() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims.sub;

  const [{ data: profil }, { data: peran }] = await Promise.all([
    supabase.from("profil").select("nama").eq("id", userId!).maybeSingle(),
    supabase.from("profil_peran").select("peran").eq("profil_id", userId!),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold">Assalamu&apos;alaikum, {profil?.nama ?? "Pengguna"}</h1>
      <p className="mt-1 text-muted-foreground">
        Peran: {peran?.length ? peran.map((p) => LABEL_PERAN[p.peran]).join(", ") : "belum diatur"}
      </p>
    </div>
  );
}

export default function BerandaPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-8 md:px-6">
      <Suspense fallback={<div className="h-16 animate-pulse rounded-lg bg-muted" />}>
        <Sapaan />
      </Suspense>
      <form action={keluar}>
        <Button type="submit" variant="outline">
          Keluar
        </Button>
      </form>
    </main>
  );
}
