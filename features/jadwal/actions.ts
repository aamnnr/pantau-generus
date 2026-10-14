"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { pesanTersimpan, setFlash } from "@/lib/flash";
import { dariZod, nilaiForm, pesanGalatDb, type FormState } from "@/lib/form";
import { LABEL_HARI } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { jadwalSchema } from "@/lib/validation/kegiatan";

export async function simpanJadwal(id: string | null, _prev: FormState, formData: FormData): Promise<FormState> {
  const values = nilaiForm(formData);
  const parsed = jadwalSchema.safeParse(values);
  if (!parsed.success) return dariZod(parsed.error, values);
  const { kelas, guru_id, jam_selesai, ...jadwal } = parsed.data;
  const baris = { ...jadwal, guru_id: guru_id ?? null, jam_selesai: jam_selesai ?? null };

  const supabase = await createClient();
  const res = id
    ? await supabase.from("jadwal_rutin").update(baris).eq("id", id).select("id").single()
    : await supabase.from("jadwal_rutin").insert(baris).select("id").single();
  if (res.error) return { error: pesanGalatDb(res.error), values };
  const jadwalId = res.data.id;

  // Kelas jadwal diganti seluruhnya sesuai pilihan (>1 kelas = jadwal gabungan).
  const { error: errHapus } = await supabase
    .from("jadwal_rutin_kelas")
    .delete()
    .eq("jadwal_rutin_id", jadwalId)
    .not("kelas_id", "in", `(${kelas.join(",")})`);
  if (errHapus) return { error: pesanGalatDb(errHapus), values };
  const { error } = await supabase
    .from("jadwal_rutin_kelas")
    .upsert(kelas.map((kelas_id) => ({ jadwal_rutin_id: jadwalId, kelas_id })), {
      onConflict: "jadwal_rutin_id,kelas_id",
      ignoreDuplicates: true,
    });
  if (error) return { error: pesanGalatDb(error), values };

  revalidatePath("/kelola/jadwal");
  revalidatePath("/hari-ini");
  await setFlash(pesanTersimpan(`Jadwal hari ${LABEL_HARI[jadwal.hari]} tersimpan. Kegiatan berikutnya disiapkan otomatis.`));
  redirect("/kelola/jadwal");
}

export async function hapusJadwal(id: string): Promise<FormState> {
  const supabase = await createClient();
  // Kegiatan yang sudah terjadi tetap ada (jadwal_rutin_id menjadi kosong).
  const { error } = await supabase.from("jadwal_rutin").delete().eq("id", id);
  if (error) return { error: pesanGalatDb(error) };
  revalidatePath("/kelola/jadwal");
  await setFlash("Jadwal sudah dihapus. Kegiatan yang sudah tercatat tetap tersimpan.");
  redirect("/kelola/jadwal");
}
