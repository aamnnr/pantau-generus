import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import type { Peran } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export type Session = {
  userId: string;
  nama: string;
  noHp: string;
  kelompokId: string;
  peran: Peran[];
  /** Peran yang sedang dipakai untuk navigasi (pengguna bisa punya beberapa peran). */
  mode: Peran;
};

const PRIORITAS: Peran[] = ["admin", "guru", "pengurus", "wali"];
export const COOKIE_MODE = "mode";

/** Dibaca sekali per request (React cache) dan dipakai layout maupun halaman. */
export const getSession = cache(async (): Promise<Session> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) redirect("/masuk");

  const [{ data: profil }, { data: peranRows }, cookieStore] = await Promise.all([
    supabase.from("profil").select("nama, no_hp, kelompok_id").eq("id", userId).single(),
    supabase.from("profil_peran").select("peran").eq("profil_id", userId),
    cookies(),
  ]);
  if (!profil) throw new Error("Profil pengguna tidak ditemukan.");

  const peran = PRIORITAS.filter((p) => peranRows?.some((r) => r.peran === p));
  const dipilih = cookieStore.get(COOKIE_MODE)?.value as Peran | undefined;
  const mode = dipilih && peran.includes(dipilih) ? dipilih : (peran[0] ?? "wali");

  return { userId, nama: profil.nama, noHp: profil.no_hp, kelompokId: profil.kelompok_id, peran, mode };
});

/** Untuk halaman: alihkan ke beranda bila tidak punya salah satu peran. RLS tetap jadi penjaga utama. */
export async function requirePeran(...izin: Peran[]): Promise<Session> {
  const session = await getSession();
  if (!session.peran.some((p) => izin.includes(p))) redirect("/beranda");
  return session;
}
