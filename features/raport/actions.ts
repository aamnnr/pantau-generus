"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { pesanTersimpan } from "@/lib/flash";
import { pesanGalatDb, type FormState } from "@/lib/form";
import { createClient } from "@/lib/supabase/server";

export type SimpanState = FormState & { ok?: string };

const catatanSchema = z.object({
  bulan: z.string().regex(/^\d{4}-\d{2}-01$/, "Bulan tidak valid."),
  catatan: z.string().trim().max(2000, "Catatan maksimal 2.000 huruf."),
});

/** Satu catatan per anak per bulan; catatan kosong = dihapus. */
export async function simpanCatatanRaport(generusId: string, _prev: SimpanState, formData: FormData): Promise<SimpanState> {
  const parsed = catatanSchema.safeParse({ bulan: formData.get("bulan"), catatan: formData.get("catatan") ?? "" });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const { bulan, catatan } = parsed.data;

  const supabase = await createClient();
  const { error } = catatan
    ? await supabase.from("catatan_raport").upsert({ generus_id: generusId, bulan, catatan }, { onConflict: "generus_id,bulan" })
    : await supabase.from("catatan_raport").delete().eq("generus_id", generusId).eq("bulan", bulan);
  if (error) return { error: pesanGalatDb(error) };

  revalidatePath(`/raport/${generusId}`);
  return { ok: pesanTersimpan("Catatan raport tersimpan ✓") };
}
