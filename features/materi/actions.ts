"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { pesanTersimpan, setFlash } from "@/lib/flash";
import { dariZod, nilaiForm, pesanGalatDb, type FormState } from "@/lib/form";
import { createClient } from "@/lib/supabase/server";
import { materiSchema } from "@/lib/validation/master";

export async function simpanMateri(id: string | null, _prev: FormState, formData: FormData): Promise<FormState> {
  const values = nilaiForm(formData);
  const parsed = materiSchema.safeParse(values);
  if (!parsed.success) return dariZod(parsed.error, values);

  const supabase = await createClient();
  const { error } = id
    ? await supabase.from("materi_item").update(parsed.data).eq("id", id)
    : await supabase.from("materi_item").insert(parsed.data);
  if (error) return { error: pesanGalatDb(error, { unik: "Materi dengan nama ini sudah ada di mapel tersebut." }), values };

  revalidatePath("/kelola/materi");
  await setFlash(pesanTersimpan("Materi tersimpan."));
  // Tetap di aspek yang sama agar input beruntun lebih cepat.
  redirect(`/kelola/materi?aspek=${parsed.data.aspek}`);
}

export async function hapusMateri(id: string): Promise<FormState> {
  const supabase = await createClient();
  const { error } = await supabase.from("materi_item").delete().eq("id", id);
  if (error) {
    return { error: pesanGalatDb(error, { dipakai: "Materi ini sudah dipakai di target atau penilaian. Ubah statusnya menjadi Nonaktif saja." }) };
  }
  revalidatePath("/kelola/materi");
  await setFlash("Materi sudah dihapus.");
  redirect("/kelola/materi");
}
