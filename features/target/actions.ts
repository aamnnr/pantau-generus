"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { pesanTersimpan, setFlash } from "@/lib/flash";
import { dariZod, nilaiForm, pesanGalatDb, type FormState } from "@/lib/form";
import { createClient } from "@/lib/supabase/server";
import { isiTargetSchema, targetInfoSchema } from "@/lib/validation/target";
import type { Json } from "@/types/database";

export type SimpanState = FormState & { ok?: string };

const PESAN_BENTROK = "Salah satu kelas sudah punya target pada periode yang bertumpukan. Periksa tanggal atau kelasnya.";

/** Ganti kelas target sesuai pilihan; trigger DB menolak periode yang bertumpukan (23P01). */
async function gantiKelas(supabase: Awaited<ReturnType<typeof createClient>>, id: string, kelas: string[]) {
  return (
    (await supabase.from("target_bulanan_kelas").delete().eq("target_bulanan_id", id).not("kelas_id", "in", `(${kelas.join(",")})`)).error ??
    (await supabase
      .from("target_bulanan_kelas")
      .upsert(kelas.map((kelas_id) => ({ target_bulanan_id: id, kelas_id })), { onConflict: "target_bulanan_id,kelas_id", ignoreDuplicates: true })).error
  );
}

export async function buatTarget(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = nilaiForm(formData);
  const parsed = targetInfoSchema.safeParse(values);
  if (!parsed.success) return dariZod(parsed.error, values);
  const { kelas, salin_dari, ...info } = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("target_bulanan")
    .insert({ ...info, semester: info.semester ?? null, catatan: info.catatan ?? null })
    .select("id")
    .single();
  if (error) return { error: pesanGalatDb(error), values };

  const errKelas = await gantiKelas(supabase, data.id, kelas);
  const errSalin = errKelas ? null : salin_dari ? (await supabase.rpc("salin_isi_target", { p_sumber_id: salin_dari, p_tujuan_id: data.id })).error : null;
  if (errKelas || errSalin) {
    await supabase.from("target_bulanan").delete().eq("id", data.id);
    const err = errKelas ?? errSalin;
    return { error: err?.code === "23P01" ? PESAN_BENTROK : pesanGalatDb(err), values };
  }

  revalidatePath("/target");
  await setFlash(pesanTersimpan(salin_dari ? "Target dibuat dan isinya disalin. Silakan sesuaikan." : "Target dibuat. Silakan isi materinya."));
  redirect(`/target/${data.id}`);
}

export async function ubahInfoTarget(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const values = nilaiForm(formData);
  const parsed = targetInfoSchema.safeParse(values);
  if (!parsed.success) return dariZod(parsed.error, values);
  const { kelas, judul, semester, mulai, selesai, catatan } = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase
    .from("target_bulanan")
    .update({ judul, mulai, selesai, semester: semester ?? null, catatan: catatan ?? null })
    .eq("id", id);
  const err = error ?? (await gantiKelas(supabase, id, kelas));
  if (err) return { error: err.code === "23P01" ? PESAN_BENTROK : pesanGalatDb(err), values };

  revalidatePath("/target");
  revalidatePath(`/target/${id}`);
  await setFlash(pesanTersimpan("Info target tersimpan."));
  redirect(`/target/${id}`);
}

/** Isi target dikirim sebagai JSON; konversi & validasi rentang di SQL (simpan_isi_target). */
export async function simpanIsiTarget(id: string, _prev: SimpanState, formData: FormData): Promise<SimpanState> {
  const parsed = isiTargetSchema.safeParse(JSON.parse(String(formData.get("isi") ?? "{}")));
  if (!parsed.success) return { error: "Isian target tidak valid. Silakan muat ulang halaman." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("simpan_isi_target", {
    p_target_id: id,
    p_kitab: parsed.data.kitab as Json,
    p_materi_item_ids: parsed.data.materi_item,
    p_tilawati: parsed.data.tilawati,
  });
  if (error) return { error: pesanGalatDb(error) };

  revalidatePath("/target");
  revalidatePath(`/target/${id}`);
  return { ok: pesanTersimpan("Target tersimpan ✓") };
}

export async function hapusTarget(id: string): Promise<FormState> {
  const supabase = await createClient();
  const { error } = await supabase.from("target_bulanan").delete().eq("id", id);
  if (error) return { error: pesanGalatDb(error) };
  revalidatePath("/target");
  await setFlash("Target sudah dihapus.");
  redirect("/target");
}
