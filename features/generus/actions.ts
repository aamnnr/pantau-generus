"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { pesanTersimpan, setFlash } from "@/lib/flash";
import { dariZod, nilaiForm, pesanGalatDb, type FormState } from "@/lib/form";
import { createClient } from "@/lib/supabase/server";
import { generusSchema, naikKelasSchema } from "@/lib/validation/master";

export async function simpanGenerus(id: string | null, _prev: FormState, formData: FormData): Promise<FormState> {
  const values = nilaiForm(formData);
  const parsed = generusSchema.safeParse(values);
  if (!parsed.success) return dariZod(parsed.error, values);

  const { wali, hubungan, tanggal_lahir, ...g } = parsed.data;
  const baris = { ...g, tanggal_lahir: tanggal_lahir ?? null };
  const supabase = await createClient();

  const res = id
    ? await supabase.from("generus").update(baris).eq("id", id).select("id").single()
    : await supabase.from("generus").insert(baris).select("id").single();
  if (res.error) return { error: pesanGalatDb(res.error), values };
  const generusId = res.data.id;

  // Relasi wali diganti seluruhnya sesuai pilihan di formulir.
  const hapus = supabase.from("generus_wali").delete().eq("generus_id", generusId);
  const { error: errHapus } = wali.length ? await hapus.not("profil_id", "in", `(${wali.join(",")})`) : await hapus;
  if (errHapus) return { error: pesanGalatDb(errHapus), values };
  if (wali.length) {
    const { error } = await supabase.from("generus_wali").upsert(
      wali.map((profil_id, i) => ({ generus_id: generusId, profil_id, hubungan: hubungan[i] || null })),
      { onConflict: "generus_id,profil_id" },
    );
    if (error) return { error: pesanGalatDb(error), values };
  }

  revalidatePath("/generus");
  await setFlash(pesanTersimpan(`Data ${g.nama} tersimpan.`));
  redirect("/generus");
}

export async function hapusGenerus(id: string): Promise<FormState> {
  const supabase = await createClient();
  const { error } = await supabase.from("generus").delete().eq("id", id);
  if (error) return { error: pesanGalatDb(error) };
  revalidatePath("/generus");
  await setFlash("Data generus sudah dihapus.");
  redirect("/generus");
}

/** Naik kelas massal (PRD F2). Riwayat kelas tercatat otomatis oleh trigger. */
export async function naikKelas(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = naikKelasSchema.safeParse(nilaiForm(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("generus")
    .update({ kelas_id: parsed.data.kelas_id })
    .in("id", parsed.data.generus)
    .select("id");
  if (error) return { error: pesanGalatDb(error) };

  revalidatePath("/generus");
  await setFlash(pesanTersimpan(`${data.length} anak dipindahkan ke kelas baru.`));
  redirect("/generus");
}
