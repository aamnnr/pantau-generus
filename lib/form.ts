import { z } from "zod";

/** Hasil Server Action untuk formulir (dipakai bersama useActionState). */
export type FormState = {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  /**
   * Isian yang dikirim. React me-reset form setelah action selesai, jadi formulir
   * memakai ini sebagai defaultValue agar isian tidak hilang saat ada galat.
   */
  values?: Record<string, string | string[]>;
};

/** Semua isian FormData; nama yang muncul lebih dari sekali (checkbox) jadi array. */
export function nilaiForm(formData: FormData): Record<string, string | string[]> {
  const hasil: Record<string, string | string[]> = {};
  for (const key of new Set(formData.keys())) {
    if (key.startsWith("$ACTION")) continue;
    const semua = formData.getAll(key).filter((v): v is string => typeof v === "string");
    hasil[key] = semua.length > 1 || key.endsWith("[]") ? semua : (semua[0] ?? "");
  }
  return hasil;
}

export function dariZod(error: z.ZodError, values?: FormState["values"]): FormState {
  return {
    error: "Ada isian yang perlu diperbaiki.",
    fieldErrors: z.flattenError(error).fieldErrors as Record<string, string[] | undefined>,
    values,
  };
}

/** Untuk komponen formulir: ambil nilai dari state (setelah galat) atau nilai awal. */
export function pilihNilai<T extends Record<string, unknown>>(state: FormState, awal: T) {
  return {
    str(key: keyof T & string): string {
      const v = state.values?.[key] ?? awal[key];
      return v == null ? "" : String(Array.isArray(v) ? v[0] : v);
    },
    arr(key: keyof T & string): string[] {
      const v = state.values ? (state.values[key] ?? []) : awal[key];
      if (v == null) return [];
      return Array.isArray(v) ? v.map(String) : [String(v)];
    },
  };
}

/** Pesan galat Postgres/Supabase yang bisa dipahami pengguna — jangan tampilkan kode mentah (DESIGN §6). */
export function pesanGalatDb(error: { code?: string; message?: string } | null | undefined, konteks?: {
  unik?: string;
  dipakai?: string;
}): string {
  switch (error?.code) {
    case "23505":
      return konteks?.unik ?? "Data dengan nama yang sama sudah ada.";
    case "23503":
      return konteks?.dipakai ?? "Data ini masih dipakai data lain, jadi tidak bisa dihapus.";
    case "42501":
      return "Anda tidak memiliki akses untuk melakukan ini.";
    case "23514":
    case "22023":
    case "23P01":
      // Pesan dari trigger/constraint kita sendiri sudah berbahasa Indonesia.
      return error.message?.startsWith("new row") ? "Isian tidak valid." : (error.message ?? "Isian tidak valid.");
    default:
      return "Maaf, terjadi kendala saat menyimpan. Silakan coba lagi.";
  }
}

/** Ambil string dari FormData; kosong → undefined agar zod `.optional()` berlaku. */
export function teks(formData: FormData, nama: string): string | undefined {
  const nilai = formData.get(nama);
  if (typeof nilai !== "string") return undefined;
  const bersih = nilai.trim();
  return bersih === "" ? undefined : bersih;
}
