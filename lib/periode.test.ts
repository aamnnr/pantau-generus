import { describe, expect, it } from "vitest";
import { bacaPeriode, hrefDengan } from "./periode";

const HARI = "2026-10-15";
const TARGET = [
  { id: "t2", judul: "November", mulai: "2026-11-08", selesai: "2026-12-05" },
  { id: "t1", judul: "Oktober", mulai: "2026-10-05", selesai: "2026-11-07" },
];

describe("periode", () => {
  it("bulan: bawaan bulan ini, lintas tahun", () => {
    const p = bacaPeriode({}, HARI, [], "bulan");
    expect([p.dari, p.sampai, p.label]).toEqual(["2026-10-01", "2026-10-31", "Oktober 2026"]);
    const d = bacaPeriode({ periode: "bulan", bulan: "2026-12" }, HARI, [], "semua");
    expect(d.sesudah).toEqual({ periode: "bulan", bulan: "2027-01" });
    expect(bacaPeriode({ bulan: "2028-02" }, HARI, [], "bulan").sampai).toBe("2028-02-29");
  });

  it("semester tetap: Juli–Desember & Januari–Juni", () => {
    const s1 = bacaPeriode({ periode: "semester" }, HARI, [], "bulan");
    expect([s1.dari, s1.sampai, s1.label]).toEqual(["2026-07-01", "2026-12-31", "Semester 1 · 2026/2027"]);
    expect(s1.sesudah).toEqual({ periode: "semester", semester: "2026-2" });
    const s2 = bacaPeriode({ periode: "semester", semester: "2026-2" }, HARI, [], "bulan");
    expect([s2.dari, s2.sampai]).toEqual(["2027-01-01", "2027-06-30"]);
    expect(bacaPeriode({ periode: "semester" }, "2027-03-01", [], "bulan").label).toBe("Semester 2 · 2026/2027");
  });

  it("target: bawaan yang berjalan, urut tanggal", () => {
    const p = bacaPeriode({ periode: "target" }, HARI, TARGET, "bulan");
    expect([p.targetId, p.dari, p.sampai]).toEqual(["t1", "2026-10-05", "2026-11-07"]);
    expect(p.sebelum).toBeUndefined();
    expect(p.sesudah).toEqual({ periode: "target", target: "t2" });
    expect(bacaPeriode({ periode: "target" }, HARI, [], "bulan").jenis).toBe("semua");
  });

  it("parameter tidak dikenal → bawaan", () => {
    expect(bacaPeriode({ periode: "x", bulan: "2026-13" }, HARI, [], "semua").label).toBe("Keseluruhan");
    expect(hrefDengan("/rekap", { kelas: "k1" }, { periode: "bulan", bulan: "2026-10" })).toBe("/rekap?kelas=k1&periode=bulan&bulan=2026-10");
  });
});
