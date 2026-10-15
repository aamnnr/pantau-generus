import { z } from "zod";

const uuid = z.uuid("Data tidak valid.");

/** Hanya baris yang berubah yang dikirim; penilaian append-only (status terakhir berlaku). */
export const penilaianSchema = z
  .array(
    z.object({
      generus_id: uuid,
      materi_item_id: uuid,
      status: z.enum(["belum", "proses", "lancar"]),
    }),
  )
  .min(1, "Belum ada penilaian yang diubah.");

export const tambahTilawatiSchema = z.object({
  generus_id: uuid,
  tambahan: z.int().min(1, "Minimal 1 halaman.").max(99, "Maksimal 99 halaman sekali catat."),
  kegiatan_id: uuid.nullable(),
});

export const posisiTilawatiSchema = z.object({
  generus_id: uuid,
  jilid: z.int().min(1, "Pilih jilid."),
  halaman: z.int().min(0, "Halaman tidak boleh negatif."),
  naik: z.boolean(),
  kegiatan_id: uuid.nullable(),
});

export const susulanSchema = z.object({
  tanggal: z.iso.date("Isi tanggal susulan."),
  baris: z.record(z.string(), z.unknown()),
});
