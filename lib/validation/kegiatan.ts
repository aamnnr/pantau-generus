import { z } from "zod";

const daftar = <T extends z.ZodType>(item: T) =>
  z.preprocess((v) => (v == null || v === "" ? [] : Array.isArray(v) ? v : [v]), z.array(item));

const kosongJadiUndefined = (v: unknown) => (v === "" ? undefined : v);
const jam = z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Jam tidak valid.");

export const jadwalSchema = z
  .object({
    hari: z.coerce.number({ error: "Pilih hari." }).int().min(1, "Pilih hari.").max(7, "Pilih hari."),
    jam_mulai: z.preprocess(kosongJadiUndefined, jam.optional()).pipe(z.string({ error: "Isi jam mulai." })),
    jam_selesai: z.preprocess(kosongJadiUndefined, jam.optional()),
    kelas: daftar(z.uuid()).pipe(z.array(z.uuid()).min(1, "Pilih minimal satu kelas.")),
    guru_id: z.preprocess(kosongJadiUndefined, z.uuid().optional()),
    aktif: z.enum(["ya", "tidak"]).default("ya").transform((v) => v === "ya"),
  })
  .refine((d) => !d.jam_selesai || d.jam_selesai > d.jam_mulai, {
    message: "Jam selesai harus setelah jam mulai.",
    path: ["jam_selesai"],
  });

export const kegiatanSchema = z
  .object({
    tanggal: z.iso.date({ error: "Pilih tanggal." }),
    jam_mulai: z.preprocess(kosongJadiUndefined, jam.optional()),
    jam_selesai: z.preprocess(kosongJadiUndefined, jam.optional()),
    judul: z.preprocess(kosongJadiUndefined, z.string().trim().max(120).optional()),
    kelas: daftar(z.uuid()).pipe(z.array(z.uuid()).min(1, "Pilih minimal satu kelas.")),
    pengajar: daftar(z.uuid()),
    catatan: z.preprocess(kosongJadiUndefined, z.string().trim().max(1000).optional()),
  })
  .refine((d) => !d.jam_selesai || !d.jam_mulai || d.jam_selesai > d.jam_mulai, {
    message: "Jam selesai harus setelah jam mulai.",
    path: ["jam_selesai"],
  });

/** Baris materi dari editor; validasi rentang yang sebenarnya ada di SQL (simpan_materi_kegiatan). */
export const barisMateriSchema = z.array(
  z.object({
    kitab_id: z.uuid({ error: "Pilih kitab." }),
    jenis: z.enum(["makna", "bacaan"]).default("makna"),
    mulai: z.number().int().positive().nullish(),
    selesai: z.number().int().positive().nullish(),
    mulai_surat: z.number().int().min(1).max(114).nullish(),
    mulai_ayat: z.number().int().positive().nullish(),
    selesai_surat: z.number().int().min(1).max(114).nullish(),
    selesai_ayat: z.number().int().positive().nullish(),
  }),
);

export const barisRundownSchema = z.array(
  z.object({
    waktu: z.string().default(""),
    aktivitas: z.string().trim().max(200).default(""),
  }),
);

export const presensiSchema = z.array(
  z.object({
    generus_id: z.uuid(),
    status: z.enum(["hadir", "terlambat", "izin", "sakit", "alpa"]),
    keterangan: z.string().trim().max(200).optional(),
  }),
);
