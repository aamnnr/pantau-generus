import { describe, expect, it } from "vitest";
import { formatJam, formatRentangJam, geserTanggal, labelKelasKegiatan } from "@/lib/format";
import { jadwalSchema, kegiatanSchema } from "./kegiatan";

const K1 = "a0000000-0000-4000-8000-000000000001";

describe("format kegiatan", () => {
  it("jam memakai titik", () => {
    expect(formatJam("19:30:00")).toBe("19.30");
    expect(formatRentangJam("19:30:00", "21:00:00")).toBe("19.30–21.00");
    expect(formatRentangJam("19:30:00", null)).toBe("19.30");
  });

  it("geser tanggal melewati batas bulan", () => {
    expect(geserTanggal("2026-10-31", 1)).toBe("2026-11-01");
    expect(geserTanggal("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("label kelas kegiatan gabungan", () => {
    expect(labelKelasKegiatan([{ jenjang: "remaja", nama: "Pelajar" }])).toBe("Remaja · Pelajar");
    expect(
      labelKelasKegiatan([
        { jenjang: "remaja", nama: "Pelajar" },
        { jenjang: "remaja", nama: "Pra-nikah" },
      ]),
    ).toBe("Pelajar + Pra-nikah");
    expect(
      labelKelasKegiatan([
        { jenjang: "caberawit", nama: "1A" },
        { jenjang: "caberawit", nama: "1B" },
      ]),
    ).toBe("Caberawit 1A + 1B");
  });
});

describe("validasi jadwal & kegiatan", () => {
  it("jadwal wajib hari, jam mulai, dan kelas", () => {
    const r = jadwalSchema.safeParse({ hari: "", jam_mulai: "", kelas: "" });
    expect(r.success).toBe(false);
    const pesan = r.error?.issues.map((i) => i.message);
    expect(pesan).toEqual(expect.arrayContaining(["Pilih hari.", "Isi jam mulai.", "Pilih minimal satu kelas."]));
  });

  it("jam selesai harus setelah jam mulai", () => {
    const r = jadwalSchema.safeParse({ hari: "2", jam_mulai: "19:30", jam_selesai: "19:00", kelas: K1 });
    expect(r.success).toBe(false);
    expect(jadwalSchema.parse({ hari: "2", jam_mulai: "19:30", jam_selesai: "21:00", kelas: K1, guru_id: "" }).guru_id).toBeUndefined();
  });

  it("kegiatan khusus: judul & jam opsional", () => {
    const k = kegiatanSchema.parse({ tanggal: "2026-10-14", kelas: [K1], jam_mulai: "", judul: "" });
    expect(k.jam_mulai).toBeUndefined();
    expect(k.pengajar).toEqual([]);
  });
});
