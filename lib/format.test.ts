import { describe, expect, it } from "vitest";
import { formatNoHp, formatTanggal, formatTanggalPendek, inisial, labelKelas, labelPenilaian } from "./format";

describe("format", () => {
  it("formatTanggal memakai nama hari & bulan Indonesia", () => {
    expect(formatTanggal("2026-10-13")).toBe("Selasa, 13 Okt 2026");
    expect(formatTanggalPendek("2026-08-17")).toBe("17 Agt 2026");
  });

  it("formatNoHp mengubah 62… menjadi 08… berkelompok", () => {
    expect(formatNoHp("6281234567890")).toBe("0812-3456-7890");
    expect(formatNoHp("62812345678")).toBe("0812-3456-78");
    expect(formatNoHp(null)).toBe("");
  });

  it("inisial dari dua kata pertama", () => {
    expect(inisial("Ahmad Fauzan Hakim")).toBe("AF");
    expect(inisial("Ahmad (uji)")).toBe("A");
    expect(inisial("bilal")).toBe("B");
  });

  it("labelPenilaian mengikuti aspek", () => {
    expect(labelPenilaian("alim", "lancar")).toBe("Lancar");
    expect(labelPenilaian("faqih", "lancar")).toBe("Paham");
    expect(labelPenilaian("akhlaqul_karimah", "lancar")).toBe("Terbiasa");
    expect(labelPenilaian("mandiri", "lancar")).toBe("Terbiasa");
    expect(labelPenilaian("faqih", "proses")).toBe("Proses");
  });

  it("labelKelas tidak mengulang nama jenjang", () => {
    expect(labelKelas({ jenjang: "caberawit", nama: "1B" })).toBe("Caberawit · 1B");
    expect(labelKelas({ jenjang: "pra_remaja", nama: "Pra-remaja" })).toBe("Pra-remaja");
  });
});
