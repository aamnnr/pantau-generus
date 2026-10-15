"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { pesanTersimpan, setFlash } from "@/lib/flash";
import { pesanGalatDb, type FormState } from "@/lib/form";
import { createClient } from "@/lib/supabase/server";
import { penilaianSchema, posisiTilawatiSchema, susulanSchema, tambahTilawatiSchema } from "@/lib/validation/progres";
import type { Json } from "@/types/database";

export type SimpanState = FormState & { ok?: string };

function segarkanAnak(ids: Iterable<string>) {
  for (const id of new Set(ids)) revalidatePath(`/generus/${id}`);
}

function bacaJson(formData: FormData, nama: string): unknown {
  try {
    return JSON.parse(String(formData.get(nama) ?? "null"));
  } catch {
    return null;
  }
}

export async function simpanPenilaian(_prev: SimpanState, formData: FormData): Promise<SimpanState> {
  const parsed = penilaianSchema.safeParse(bacaJson(formData, "penilaian"));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Isian penilaian tidak valid." };

  const supabase = await createClient();
  const { error } = await supabase.from("penilaian").insert(parsed.data);
  if (error) return { error: pesanGalatDb(error) };

  segarkanAnak(parsed.data.map((x) => x.generus_id));
  revalidatePath("/penilaian");
  return { ok: pesanTersimpan(`Penilaian tersimpan ✓`) };
}

export type HasilTilawati =
  | { ok: true; jilid: number; halaman: number; total_halaman: number | null; sisa: number }
  | { ok: false; error: string };

/** Tombol +N (DESIGN §7.4a). Dipanggil langsung dari komponen, bukan lewat form. */
export async function tambahTilawati(input: unknown): Promise<HasilTilawati> {
  const parsed = tambahTilawatiSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Isian tidak valid." };
  const { generus_id, tambahan, kegiatan_id } = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase
    .rpc("tambah_tilawati", { p_generus_id: generus_id, p_tambahan: tambahan, p_kegiatan_id: kegiatan_id ?? undefined })
    .single();
  if (error || !data) return { ok: false, error: pesanGalatDb(error) };

  segarkanAnak([generus_id]);
  if (kegiatan_id) revalidatePath(`/kegiatan/${kegiatan_id}`);
  return { ok: true, ...data };
}

/** Koreksi posisi, posisi awal, naik jilid, maupun "Urungkan" (dicatat sebagai koreksi — riwayat append-only). */
export async function aturPosisiTilawati(input: unknown): Promise<HasilTilawati> {
  const parsed = posisiTilawatiSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Isian tidak valid." };
  const { generus_id, jilid, halaman, naik, kegiatan_id } = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.rpc("atur_posisi_tilawati", {
    p_generus_id: generus_id,
    p_jilid: jilid,
    p_halaman: halaman,
    p_naik: naik,
    p_kegiatan_id: kegiatan_id ?? undefined,
  });
  if (error) return { ok: false, error: pesanGalatDb(error) };

  const { data: pos } = await supabase.from("v_posisi_tilawati").select("total_halaman").eq("generus_id", generus_id).maybeSingle();
  segarkanAnak([generus_id]);
  if (kegiatan_id) revalidatePath(`/kegiatan/${kegiatan_id}`);
  return { ok: true, jilid, halaman, total_halaman: pos?.total_halaman ?? null, sisa: 0 };
}

export async function simpanSusulan(generusId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const values = { tanggal: String(formData.get("tanggal") ?? "") };
  const parsed = susulanSchema.safeParse({ tanggal: values.tanggal, baris: bacaJson(formData, "baris") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Lengkapi materi susulan.", values };

  const supabase = await createClient();
  const { error } = await supabase.rpc("simpan_susulan", {
    p_generus_id: generusId,
    p_baris: parsed.data.baris as Json,
    p_tanggal: parsed.data.tanggal,
  });
  if (error) return { error: pesanGalatDb(error).replace(/^Baris 1: /, ""), values };

  segarkanAnak([generusId]);
  await setFlash(pesanTersimpan("Susulan tercatat ✓"));
  redirect(`/generus/${generusId}`);
}

export async function hapusSusulan(generusId: string, susulanId: string): Promise<FormState> {
  const supabase = await createClient();
  const { error } = await supabase.from("susulan").delete().eq("id", susulanId);
  if (error) return { error: pesanGalatDb(error) };
  segarkanAnak([generusId]);
  await setFlash("Catatan susulan sudah dihapus.");
  redirect(`/generus/${generusId}`);
}
