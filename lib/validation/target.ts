import { z } from "zod";

const daftar = <T extends z.ZodType>(item: T) =>
  z.preprocess((v) => (v == null || v === "" ? [] : Array.isArray(v) ? v : [v]), z.array(item));
const kosongJadiUndefined = (v: unknown) => (v === "" ? undefined : v);

/** Info periode target (PRD F5). Isi target disimpan terpisah lewat simpan_isi_target. */
export const targetInfoSchema = z
  .object({
    judul: z.string({ error: "Judul wajib diisi." }).trim().min(1, "Judul wajib diisi.").max(120),
    semester: z.preprocess(kosongJadiUndefined, z.string().trim().max(60).optional()),
    mulai: z.iso.date({ error: "Pilih tanggal mulai." }),
    selesai: z.iso.date({ error: "Pilih tanggal selesai." }),
    kelas: daftar(z.uuid()).pipe(z.array(z.uuid()).min(1, "Pilih minimal satu kelas.")),
    catatan: z.preprocess(kosongJadiUndefined, z.string().trim().max(2000).optional()),
    salin_dari: z.preprocess(kosongJadiUndefined, z.uuid().optional()),
  })
  .refine((d) => d.selesai >= d.mulai, { message: "Tanggal selesai tidak boleh sebelum tanggal mulai.", path: ["selesai"] });

export const isiTargetSchema = z.object({
  kitab: z.array(z.record(z.string(), z.unknown())),
  materi_item: z.array(z.uuid()),
  tilawati: z
    .object({ jilid: z.number().int().min(1), halaman: z.number().int().min(0) })
    .nullable(),
});
