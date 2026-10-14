"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { pesanTersimpan, setFlash } from "@/lib/flash";
import { dariZod, nilaiForm, pesanGalatDb, type FormState } from "@/lib/form";
import { createClient } from "@/lib/supabase/server";
import { kitabSchema } from "@/lib/validation/master";

/** Hanya kitab Al-Hadist yang bisa ditambah/diubah; Al-Qur'an dibuat otomatis per kelompok. */
export async function simpanKitab(id: string | null, _prev: FormState, formData: FormData): Promise<FormState> {
  const values = nilaiForm(formData);
  const parsed = kitabSchema.safeParse(values);
  if (!parsed.success) return dariZod(parsed.error, values);

  const supabase = await createClient();
  const baris = { ...parsed.data, jenis: "hadist" as const, satuan: "halaman" as const };
  const { error } = id
    ? await supabase.from("kitab").update(baris).eq("id", id).eq("jenis", "hadist")
    : await supabase.from("kitab").insert(baris);
  if (error) return { error: pesanGalatDb(error, { unik: "Nama kitab ini sudah ada." }), values };

  revalidatePath("/kelola/kitab");
  await setFlash(pesanTersimpan(`Kitab ${parsed.data.nama} tersimpan.`));
  redirect("/kelola/kitab");
}

export async function hapusKitab(id: string): Promise<FormState> {
  const supabase = await createClient();
  const { error } = await supabase.from("kitab").delete().eq("id", id).eq("jenis", "hadist");
  if (error) {
    return { error: pesanGalatDb(error, { dipakai: "Kitab ini sudah dipakai di kegiatan atau target. Ubah statusnya menjadi Nonaktif saja." }) };
  }
  revalidatePath("/kelola/kitab");
  await setFlash("Kitab sudah dihapus.");
  redirect("/kelola/kitab");
}
