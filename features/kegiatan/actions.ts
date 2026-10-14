"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { pesanTersimpan, setFlash } from "@/lib/flash";
import { dariZod, nilaiForm, pesanGalatDb, type FormState } from "@/lib/form";
import { LABEL_PRESENSI, URUTAN_PRESENSI } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { barisMateriSchema, barisRundownSchema, kegiatanSchema, presensiSchema } from "@/lib/validation/kegiatan";

export type SimpanState = FormState & { ok?: string };

function segarkan(id: string) {
  revalidatePath(`/kegiatan/${id}`);
  revalidatePath("/hari-ini");
  revalidatePath("/riwayat");
}

/** Ganti relasi kelas & pengajar kegiatan sesuai pilihan formulir. */
async function gantiRelasi(supabase: Awaited<ReturnType<typeof createClient>>, id: string, kelas: string[], pengajar: string[]) {
  const errKelas =
    (await supabase.from("kegiatan_kelas").delete().eq("kegiatan_id", id).not("kelas_id", "in", `(${kelas.join(",")})`)).error ??
    (await supabase
      .from("kegiatan_kelas")
      .upsert(kelas.map((kelas_id) => ({ kegiatan_id: id, kelas_id })), { onConflict: "kegiatan_id,kelas_id", ignoreDuplicates: true })).error;
  if (errKelas) return errKelas;

  const hapus = supabase.from("kegiatan_pengajar").delete().eq("kegiatan_id", id);
  const errHapus = (pengajar.length ? await hapus.not("guru_id", "in", `(${pengajar.join(",")})`) : await hapus).error;
  if (errHapus) return errHapus;
  if (!pengajar.length) return null;
  return (
    await supabase
      .from("kegiatan_pengajar")
      .upsert(pengajar.map((guru_id) => ({ kegiatan_id: id, guru_id })), { onConflict: "kegiatan_id,guru_id", ignoreDuplicates: true })
  ).error;
}

/** Kegiatan khusus (di luar jadwal rutin), mis. pengajian umum gabungan. */
export async function buatKegiatan(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = nilaiForm(formData);
  const parsed = kegiatanSchema.safeParse(values);
  if (!parsed.success) return dariZod(parsed.error, values);
  const { kelas, pengajar, ...k } = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("kegiatan")
    .insert({ ...k, jenis: "khusus", jam_mulai: k.jam_mulai ?? null, jam_selesai: k.jam_selesai ?? null })
    .select("id")
    .single();
  if (error) return { error: pesanGalatDb(error), values };

  const errRelasi = await gantiRelasi(supabase, data.id, kelas, pengajar);
  if (errRelasi) {
    await supabase.from("kegiatan").delete().eq("id", data.id);
    return { error: pesanGalatDb(errRelasi), values };
  }

  segarkan(data.id);
  await setFlash(pesanTersimpan("Kegiatan dibuat. Silakan isi materi dan kehadiran."));
  redirect(`/kegiatan/${data.id}`);
}

export async function ubahKegiatan(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const values = nilaiForm(formData);
  const parsed = kegiatanSchema.safeParse(values);
  if (!parsed.success) return dariZod(parsed.error, values);
  const { kelas, pengajar, ...k } = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase
    .from("kegiatan")
    .update({ ...k, judul: k.judul ?? null, catatan: k.catatan ?? null, jam_mulai: k.jam_mulai ?? null, jam_selesai: k.jam_selesai ?? null })
    .eq("id", id);
  if (error) return { error: pesanGalatDb(error), values };
  const errRelasi = await gantiRelasi(supabase, id, kelas, pengajar);
  if (errRelasi) return { error: pesanGalatDb(errRelasi), values };

  segarkan(id);
  await setFlash(pesanTersimpan("Info kegiatan tersimpan."));
  redirect(`/kegiatan/${id}`);
}

/**
 * Materi kitab + rundown + materi item dikirim sebagai JSON dari editor;
 * konversi & validasi rentang di SQL.
 */
export async function simpanMateri(id: string, _prev: SimpanState, formData: FormData): Promise<SimpanState> {
  const materi = barisMateriSchema.safeParse(JSON.parse(String(formData.get("materi") ?? "[]")));
  const rundown = barisRundownSchema.safeParse(JSON.parse(String(formData.get("rundown") ?? "[]")));
  if (!materi.success) return { error: "Lengkapi kitab dan rentang pada setiap baris materi." };
  if (!rundown.success) return { error: "Periksa kembali isian rundown." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("simpan_materi_kegiatan", { p_kegiatan_id: id, p_baris: materi.data });
  if (error) return { error: pesanGalatDb(error) };
  const { error: errRundown } = await supabase.rpc("simpan_rundown", { p_kegiatan_id: id, p_baris: rundown.data });
  if (errRundown) return { error: pesanGalatDb(errRundown) };

  const items = z.array(z.uuid()).safeParse(JSON.parse(String(formData.get("materi_item") ?? "[]")));
  if (!items.success) return { error: "Pilihan materi tidak valid. Silakan muat ulang halaman." };
  const { error: errItem } = await supabase.rpc("simpan_materi_item_kegiatan", { p_kegiatan_id: id, p_materi_item_ids: items.data });
  if (errItem) return { error: pesanGalatDb(errItem) };

  segarkan(id);
  return { ok: pesanTersimpan("Materi tersimpan ✓") };
}

export async function simpanPresensi(id: string, _prev: SimpanState, formData: FormData): Promise<SimpanState> {
  const parsed = presensiSchema.safeParse(JSON.parse(String(formData.get("presensi") ?? "[]")));
  if (!parsed.success) return { error: "Data kehadiran tidak valid. Silakan muat ulang halaman." };
  if (parsed.data.length === 0) return { error: "Belum ada anak di kelas ini." };

  const supabase = await createClient();
  const { error } = await supabase.from("presensi").upsert(
    parsed.data.map((p) => ({ kegiatan_id: id, generus_id: p.generus_id, status: p.status, keterangan: p.keterangan || null })),
    { onConflict: "kegiatan_id,generus_id" },
  );
  if (error) return { error: pesanGalatDb(error) };

  segarkan(id);
  const ringkasan = URUTAN_PRESENSI.map((s) => `${LABEL_PRESENSI[s]} ${parsed.data.filter((p) => p.status === s).length}`)
    .filter((t) => !t.endsWith(" 0"))
    .join(" · ");
  return { ok: pesanTersimpan(`Kehadiran tersimpan ✓ (${ringkasan})`) };
}

/** Selesai / libur (batal) / buka kembali. */
export async function ubahStatusKegiatan(id: string, status: "terjadwal" | "selesai" | "batal"): Promise<FormState> {
  const supabase = await createClient();
  const { error } = await supabase.from("kegiatan").update({ status }).eq("id", id);
  if (error) return { error: pesanGalatDb(error) };
  segarkan(id);
  await setFlash(
    status === "selesai"
      ? pesanTersimpan("Kegiatan ditandai selesai.")
      : status === "batal"
        ? "Kegiatan ditandai libur."
        : "Kegiatan dibuka kembali.",
  );
  redirect(`/kegiatan/${id}`);
}

/** Versi untuk `<form action>` (harus mengembalikan void); galat dilempar ke error boundary. */
export async function aturStatusKegiatan(id: string, status: "terjadwal" | "selesai" | "batal"): Promise<void> {
  const hasil = await ubahStatusKegiatan(id, status);
  if (hasil.error) throw new Error(hasil.error);
}

/** Hanya kegiatan khusus; kegiatan rutin cukup diliburkan agar tidak dibuat ulang dari jadwal. */
export async function hapusKegiatan(id: string, tanggal: string): Promise<FormState> {
  const supabase = await createClient();
  const { error } = await supabase.from("kegiatan").delete().eq("id", id).eq("jenis", "khusus");
  if (error) return { error: pesanGalatDb(error) };
  revalidatePath("/hari-ini");
  await setFlash("Kegiatan sudah dihapus.");
  redirect(`/hari-ini?tanggal=${tanggal}`);
}
