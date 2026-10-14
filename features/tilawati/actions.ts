"use server";

import { revalidatePath } from "next/cache";
import { pesanTersimpan } from "@/lib/flash";
import { dariZod, nilaiForm, pesanGalatDb, type FormState } from "@/lib/form";
import { createClient } from "@/lib/supabase/server";
import { jilidSchema } from "@/lib/validation/master";

export type JilidState = FormState & { ok?: string };

/** Disimpan di tempat (tanpa pindah halaman) karena daftar jilid pendek dan diubah per baris. */
export async function simpanJilid(id: string | null, _prev: JilidState, formData: FormData): Promise<JilidState> {
  const values = nilaiForm(formData);
  const parsed = jilidSchema.safeParse(values);
  if (!parsed.success) return dariZod(parsed.error, values);

  const supabase = await createClient();
  const { error } = id
    ? await supabase.from("jilid_tilawati").update(parsed.data).eq("id", id)
    : await supabase.from("jilid_tilawati").insert(parsed.data);
  if (error) return { error: pesanGalatDb(error, { unik: `Jilid ${parsed.data.jilid} sudah ada.` }), values };

  revalidatePath("/kelola/tilawati");
  return { ok: pesanTersimpan(`Jilid ${parsed.data.jilid} tersimpan.`) };
}

export async function hapusJilid(id: string): Promise<FormState> {
  const supabase = await createClient();
  const { error } = await supabase.from("jilid_tilawati").delete().eq("id", id);
  if (error) return { error: pesanGalatDb(error) };
  revalidatePath("/kelola/tilawati");
  return {};
}
