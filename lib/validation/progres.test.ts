import { describe, expect, it } from "vitest";
import { labelPenilaian, teksPosisiTilawati } from "@/lib/format";
import { penilaianSchema, posisiTilawatiSchema, tambahTilawatiSchema } from "./progres";

const A = "a0000000-0000-4000-8000-000000000001";
const B = "a0000000-0000-4000-8000-000000000002";

describe("progres", () => {
  it("label penilaian mengikuti aspek", () => {
    expect(labelPenilaian("alim", "lancar")).toBe("Lancar");
    expect(labelPenilaian("faqih", "lancar")).toBe("Paham");
    expect(labelPenilaian("mandiri", "lancar")).toBe("Terbiasa");
    expect(labelPenilaian("faqih", "proses")).toBe("Proses");
  });

  it("posisi tilawati", () => {
    expect(teksPosisiTilawati({ jilid: 3, halaman: 24 })).toBe("Jilid 3 · hal. 24");
    expect(teksPosisiTilawati(null)).toBe("Posisi belum diisi");
  });

  it("penilaian: minimal satu baris berubah, status valid", () => {
    expect(penilaianSchema.safeParse([]).success).toBe(false);
    expect(penilaianSchema.safeParse([{ generus_id: A, materi_item_id: B, status: "lancar" }]).success).toBe(true);
    expect(penilaianSchema.safeParse([{ generus_id: A, materi_item_id: B, status: "paham" }]).success).toBe(false);
  });

  it("tilawati: +N 1–99, posisi tidak negatif", () => {
    expect(tambahTilawatiSchema.safeParse({ generus_id: A, tambahan: 0, kegiatan_id: null }).success).toBe(false);
    expect(tambahTilawatiSchema.safeParse({ generus_id: A, tambahan: 3, kegiatan_id: B }).success).toBe(true);
    expect(posisiTilawatiSchema.safeParse({ generus_id: A, jilid: 2, halaman: -1, naik: false, kegiatan_id: null }).success).toBe(false);
    expect(posisiTilawatiSchema.safeParse({ generus_id: A, jilid: 2, halaman: 0, naik: true, kegiatan_id: null }).success).toBe(true);
  });
});
