"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { phoneToEmail } from "@/lib/auth/phone";
import { getSession } from "@/lib/auth/session";
import { pesanTersimpan, setFlash } from "@/lib/flash";
import { dariZod, nilaiForm, pesanGalatDb, type FormState } from "@/lib/form";
import type { Peran } from "@/lib/format";
import { createAdminClient } from "@/lib/supabase/admin";
import { akunBaruSchema, akunUbahSchema, resetPinSchema } from "@/lib/validation/master";

// Manajemen akun memakai secret key (melewati RLS), jadi peran admin WAJIB dicek di sini.
async function pastikanAdmin() {
  const session = await getSession();
  if (!session.peran.includes("admin")) throw new Error("Hanya admin yang boleh mengelola akun.");
  return session;
}

const domain = () => process.env.AUTH_EMAIL_DOMAIN!;

function pesanAuth(message: string | undefined) {
  if (message && /already|registered|exists/i.test(message)) return "No. HP ini sudah punya akun.";
  return "Maaf, akun belum bisa disimpan. Silakan coba lagi.";
}

/** Akun berperan guru ditautkan ke data guru (dibuat bila belum ada) agar bisa mengisi kelasnya. */
async function tautkanGuru(db: ReturnType<typeof createAdminClient>, kelompokId: string, profilId: string, nama: string, noHp: string) {
  const { data: sudah } = await db.from("guru").select("id").eq("profil_id", profilId).maybeSingle();
  if (sudah) return null;
  const { data: cocok } = await db
    .from("guru")
    .select("id")
    .eq("kelompok_id", kelompokId)
    .eq("no_hp", noHp)
    .is("profil_id", null)
    .maybeSingle();
  const { error } = cocok
    ? await db.from("guru").update({ profil_id: profilId }).eq("id", cocok.id)
    : await db.from("guru").insert({ kelompok_id: kelompokId, nama, no_hp: noHp, profil_id: profilId });
  return error;
}

export async function buatAkun(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await pastikanAdmin();
  const values = nilaiForm(formData);
  delete values.pin; // PIN tidak dikembalikan ke browser
  const parsed = akunBaruSchema.safeParse(nilaiForm(formData));
  if (!parsed.success) return dariZod(parsed.error, values);
  const { nama, no_hp, pin, peran } = parsed.data;

  const db = createAdminClient();
  const { data: user, error: errUser } = await db.auth.admin.createUser({
    email: phoneToEmail(no_hp, domain()),
    password: pin,
    email_confirm: true,
  });
  if (errUser) return { error: pesanAuth(errUser.message), values };

  const id = user.user.id;
  const errProfil =
    (await db.from("profil").insert({ id, kelompok_id: session.kelompokId, nama, no_hp })).error ??
    (await db.from("profil_peran").insert(peran.map((p) => ({ kelompok_id: session.kelompokId, profil_id: id, peran: p })))).error ??
    (peran.includes("guru") ? await tautkanGuru(db, session.kelompokId, id, nama, no_hp) : null);

  if (errProfil) {
    await db.auth.admin.deleteUser(id); // jangan tinggalkan akun tanpa profil
    return { error: pesanGalatDb(errProfil, { unik: "No. HP ini sudah punya akun." }), values };
  }

  revalidatePath("/kelola/akun");
  await setFlash(pesanTersimpan(`Akun ${nama} dibuat. Sampaikan No. HP & PIN kepada yang bersangkutan.`));
  redirect("/kelola/akun");
}

export async function ubahAkun(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const session = await pastikanAdmin();
  const values = nilaiForm(formData);
  const parsed = akunUbahSchema.safeParse(values);
  if (!parsed.success) return dariZod(parsed.error, values);
  const { nama, no_hp, peran } = parsed.data;

  if (id === session.userId && !peran.includes("admin")) {
    return { error: "Anda tidak bisa melepas peran admin dari akun sendiri.", values };
  }

  const db = createAdminClient();
  const { data: lama } = await db.from("profil").select("no_hp").eq("id", id).single();
  if (lama && lama.no_hp !== no_hp) {
    const { error } = await db.auth.admin.updateUserById(id, { email: phoneToEmail(no_hp, domain()) });
    if (error) return { error: pesanAuth(error.message), values };
  }

  const { error: errProfil } = await db.from("profil").update({ nama, no_hp }).eq("id", id);
  if (errProfil) return { error: pesanGalatDb(errProfil, { unik: "No. HP ini sudah punya akun." }), values };

  const { error: errHapus } = await db.from("profil_peran").delete().eq("profil_id", id).not("peran", "in", `(${peran.join(",")})`);
  const { error: errTambah } = await db
    .from("profil_peran")
    .upsert(peran.map((p: Peran) => ({ kelompok_id: session.kelompokId, profil_id: id, peran: p })), {
      onConflict: "profil_id,peran",
      ignoreDuplicates: true,
    });
  const errGuru = peran.includes("guru") ? await tautkanGuru(db, session.kelompokId, id, nama, no_hp) : null;
  const err = errHapus ?? errTambah ?? errGuru;
  if (err) return { error: pesanGalatDb(err), values };

  revalidatePath("/kelola/akun");
  await setFlash(pesanTersimpan(`Akun ${nama} tersimpan.`));
  redirect("/kelola/akun");
}

export async function resetPin(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  await pastikanAdmin();
  const parsed = resetPinSchema.safeParse({ pin: formData.get("pin") });
  if (!parsed.success) return dariZod(parsed.error);

  const { error } = await createAdminClient().auth.admin.updateUserById(id, { password: parsed.data.pin });
  if (error) return { error: "PIN belum bisa diganti. Silakan coba lagi." };

  await setFlash(pesanTersimpan("PIN baru sudah berlaku. Sampaikan kepada pemilik akun."));
  redirect(`/kelola/akun/${id}`);
}

export async function hapusAkun(id: string): Promise<FormState> {
  const session = await pastikanAdmin();
  if (id === session.userId) return { error: "Anda tidak bisa menghapus akun sendiri." };

  const { error } = await createAdminClient().auth.admin.deleteUser(id);
  if (error) return { error: "Akun belum bisa dihapus. Silakan coba lagi." };

  revalidatePath("/kelola/akun");
  await setFlash("Akun sudah dihapus.");
  redirect("/kelola/akun");
}
