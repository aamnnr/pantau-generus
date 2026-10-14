"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { normalizePhone, phoneToEmail } from "@/lib/auth/phone";
import { COOKIE_MODE, getSession } from "@/lib/auth/session";
import type { Peran } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { masukSchema } from "@/lib/validation/auth";

export type MasukState = { error?: string; noHp?: string };

export async function masuk(_prev: MasukState, formData: FormData): Promise<MasukState> {
  const noHp = String(formData.get("noHp") ?? "");
  const parsed = masukSchema.safeParse({ noHp, pin: formData.get("pin") });
  if (!parsed.success) return { error: parsed.error.issues[0].message, noHp };

  const nomor = normalizePhone(parsed.data.noHp);
  if (!nomor) return { error: "No. HP tidak dikenali. Contoh: 0812 3456 7890.", noHp };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: phoneToEmail(nomor, process.env.AUTH_EMAIL_DOMAIN!),
    password: parsed.data.pin,
  });

  if (error) {
    // Pesan sama untuk nomor tak terdaftar & PIN salah agar nomor anggota tidak bisa ditebak.
    const pesan =
      error.status === 429
        ? "Terlalu banyak percobaan. Silakan tunggu beberapa menit, lalu coba lagi."
        : "No. HP atau PIN salah. Silakan coba lagi.";
    return { error: pesan, noHp };
  }

  redirect("/beranda");
}

export async function keluar() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  (await cookies()).delete(COOKIE_MODE);
  redirect("/masuk");
}

/** Pengguna dengan beberapa peran memilih mode navigasi (DESIGN §5 "Ganti Mode"). */
export async function gantiMode(peran: Peran) {
  const session = await getSession();
  if (!session.peran.includes(peran)) return;
  (await cookies()).set(COOKIE_MODE, peran, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  redirect("/beranda");
}
