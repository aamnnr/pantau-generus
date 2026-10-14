import { z } from "zod";
import { normalizePhone } from "@/lib/auth/phone";

const nama = (label: string) =>
  z.string({ error: `${label} wajib diisi.` }).trim().min(1, `${label} wajib diisi.`).max(120, `${label} terlalu panjang.`);

const noHpWajib = z
  .string({ error: "No. HP wajib diisi." })
  .trim()
  .min(1, "No. HP wajib diisi.")
  .transform((v, ctx) => {
    const n = normalizePhone(v);
    if (!n) {
      ctx.addIssue({ code: "custom", message: "No. HP tidak dikenali. Contoh: 0812 3456 7890." });
      return z.NEVER;
    }
    return n;
  });

const noHpOpsional = z
  .string()
  .trim()
  .optional()
  .transform((v, ctx) => {
    if (!v) return null;
    const n = normalizePhone(v);
    if (!n) {
      ctx.addIssue({ code: "custom", message: "No. HP tidak dikenali. Contoh: 0812 3456 7890." });
      return z.NEVER;
    }
    return n;
  });

/** Checkbox: satu pilihan terkirim sebagai string, beberapa sebagai array. */
const daftar = <T extends z.ZodType>(item: T) =>
  z.preprocess((v) => (v == null || v === "" ? [] : Array.isArray(v) ? v : [v]), z.array(item));

const jenjang = z.enum(["caberawit", "pra_remaja", "remaja"], { error: "Pilih jenjang." });
const jenisKelamin = z.enum(["laki_laki", "perempuan"], { error: "Pilih jenis kelamin." });
const urutan = z.coerce.number({ error: "Urutan harus angka." }).int().min(0).max(999).default(0);
const aktif = z.enum(["ya", "tidak"]).default("ya").transform((v) => v === "ya");

export const kelasSchema = z.object({
  jenjang,
  nama: nama("Nama kelas"),
  urutan,
  aktif,
});

export const generusSchema = z.object({
  nama: nama("Nama"),
  jenis_kelamin: jenisKelamin,
  tanggal_lahir: z.preprocess((v) => (v === "" ? undefined : v), z.iso.date({ error: "Tanggal lahir tidak valid." }).optional()),
  kelas_id: z.uuid({ error: "Pilih kelas." }),
  status: z.enum(["aktif", "lulus", "pindah", "nonaktif"]).default("aktif"),
  wali: daftar(z.uuid()),
  hubungan: daftar(z.string().trim().max(40)),
});

export const naikKelasSchema = z.object({
  generus: daftar(z.uuid()).pipe(z.array(z.uuid()).min(1, "Pilih minimal satu anak.")),
  kelas_id: z.uuid({ error: "Pilih kelas tujuan." }),
});

export const guruSchema = z.object({
  nama: nama("Nama guru"),
  no_hp: noHpOpsional,
  kelas: daftar(z.uuid()),
  aktif,
});

const peran = z.enum(["admin", "guru", "pengurus", "wali"]);
const pin = z.string({ error: "PIN wajib diisi." }).regex(/^\d{6}$/, "PIN terdiri dari 6 angka.");

export const akunBaruSchema = z.object({
  nama: nama("Nama"),
  no_hp: noHpWajib,
  pin,
  peran: daftar(peran).pipe(z.array(peran).min(1, "Pilih minimal satu peran.")),
});

export const akunUbahSchema = z.object({
  nama: nama("Nama"),
  no_hp: noHpWajib,
  peran: daftar(peran).pipe(z.array(peran).min(1, "Pilih minimal satu peran.")),
});

export const resetPinSchema = z.object({ pin });

export const kitabSchema = z.object({
  nama: nama("Nama kitab"),
  total_satuan: z.coerce
    .number({ error: "Jumlah halaman harus angka." })
    .int("Jumlah halaman harus bilangan bulat.")
    .min(1, "Jumlah halaman minimal 1.")
    .max(5000, "Jumlah halaman terlalu besar."),
  urutan,
  aktif,
});

export const materiSchema = z.object({
  aspek: z.enum(["alim", "faqih", "akhlaqul_karimah", "mandiri"], { error: "Pilih aspek." }),
  mapel: nama("Mapel"),
  nama: z.string({ error: "Nama materi wajib diisi." }).trim().min(1, "Nama materi wajib diisi.").max(300),
  keterangan: z.string().trim().max(1000).optional().transform((v) => v || null),
  jenjang: z
    .enum(["semua", "caberawit", "pra_remaja", "remaja"])
    .default("semua")
    .transform((v) => (v === "semua" ? null : v)),
  jenis_kelamin: z
    .enum(["semua", "laki_laki", "perempuan"])
    .default("semua")
    .transform((v) => (v === "semua" ? null : v)),
  urutan,
  aktif,
});

export const jilidSchema = z.object({
  jilid: z.coerce.number({ error: "Jilid harus angka." }).int().min(1, "Jilid minimal 1.").max(20),
  total_halaman: z.coerce.number({ error: "Jumlah halaman harus angka." }).int().min(1, "Minimal 1 halaman.").max(500),
});
