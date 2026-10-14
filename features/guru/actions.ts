"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { pesanTersimpan, setFlash } from "@/lib/flash";
import { dariZod, nilaiForm, pesanGalatDb, type FormState } from "@/lib/form";
import { createClient } from "@/lib/supabase/server";
import { guruSchema } from "@/lib/validation/master";

export async function simpanGuru(id: string | null, _prev: FormState, formData: FormData): Promise<FormState> {
  const values = nilaiForm(formData);
  const parsed = guruSchema.safeParse(values);
  if (!parsed.success) return dariZod(parsed.error, values);
  const { kelas, ...guru } = parsed.data;

  const supabase = await createClient();
  const res = id
    ? await supabase.from("guru").update(guru).eq("id", id).select("id").single()
    : await supabase.from("guru").insert(guru).select("id").single();
  if (res.error) return { error: pesanGalatDb(res.error), values };
  const guruId = res.data.id;

  // Kelas yang diajar diganti seluruhnya sesuai pilihan.
  const hapus = supabase.from("guru_kelas").delete().eq("guru_id", guruId);
  const { error: errHapus } = kelas.length ? await hapus.not("kelas_id", "in", `(${kelas.join(",")})`) : await hapus;
  if (errHapus) return { error: pesanGalatDb(errHapus), values };
  if (kelas.length) {
    const { error } = await supabase
      .from("guru_kelas")
      .upsert(kelas.map((kelas_id) => ({ guru_id: guruId, kelas_id })), { onConflict: "guru_id,kelas_id", ignoreDuplicates: true });
    if (error) return { error: pesanGalatDb(error), values };
  }

  revalidatePath("/kelola/guru");
  await setFlash(pesanTersimpan(`Data guru ${guru.nama} tersimpan.`));
  redirect("/kelola/guru");
}

export async function hapusGuru(id: string): Promise<FormState> {
  const supabase = await createClient();
  const { error } = await supabase.from("guru").delete().eq("id", id);
  if (error) {
    return {
      error: pesanGalatDb(error, {
        dipakai: "Guru ini sudah tercatat mengajar di kegiatan. Ubah statusnya menjadi Nonaktif saja.",
      }),
    };
  }
  revalidatePath("/kelola/guru");
  await setFlash("Data guru sudah dihapus.");
  redirect("/kelola/guru");
}
