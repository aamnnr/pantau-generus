"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { pesanTersimpan, setFlash } from "@/lib/flash";
import { dariZod, nilaiForm, pesanGalatDb, type FormState } from "@/lib/form";
import { createClient } from "@/lib/supabase/server";
import { kelasSchema } from "@/lib/validation/master";

export async function simpanKelas(id: string | null, _prev: FormState, formData: FormData): Promise<FormState> {
  const values = nilaiForm(formData);
  const parsed = kelasSchema.safeParse(values);
  if (!parsed.success) return dariZod(parsed.error, values);

  const supabase = await createClient();
  const { error } = id
    ? await supabase.from("kelas").update(parsed.data).eq("id", id)
    : await supabase.from("kelas").insert(parsed.data);
  if (error) return { error: pesanGalatDb(error, { unik: "Nama kelas ini sudah dipakai." }), values };

  revalidatePath("/kelola/kelas");
  await setFlash(pesanTersimpan(`Kelas ${parsed.data.nama} tersimpan.`));
  redirect("/kelola/kelas");
}

export async function hapusKelas(id: string): Promise<FormState> {
  const supabase = await createClient();
  const { error } = await supabase.from("kelas").delete().eq("id", id);
  if (error) {
    return {
      error: pesanGalatDb(error, {
        dipakai: "Kelas ini masih punya anak atau riwayat kegiatan. Ubah statusnya menjadi Nonaktif saja.",
      }),
    };
  }
  revalidatePath("/kelola/kelas");
  await setFlash("Kelas sudah dihapus.");
  redirect("/kelola/kelas");
}
