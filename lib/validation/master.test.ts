import { describe, expect, it } from "vitest";
import { akunBaruSchema, generusSchema, guruSchema, kitabSchema, materiSchema } from "./master";

const UUID = "a0000000-0000-4000-8000-000000000001";

describe("validasi master data", () => {
  it("akun: no HP dinormalisasi, PIN 6 angka, minimal satu peran", () => {
    const ok = akunBaruSchema.safeParse({ nama: "Nur", no_hp: "0858-6910-6314", pin: "123456", peran: ["admin"] });
    expect(ok.success && ok.data.no_hp).toBe("6285869106314");

    const salah = akunBaruSchema.safeParse({ nama: "", no_hp: "123", pin: "12", peran: [] });
    expect(salah.success).toBe(false);
    const pesan = salah.error?.issues.map((i) => i.message);
    expect(pesan).toEqual(
      expect.arrayContaining(["Nama wajib diisi.", "PIN terdiri dari 6 angka.", "Pilih minimal satu peran."]),
    );
  });

  it("guru: no HP opsional", () => {
    expect(guruSchema.parse({ nama: "Ust. A" }).no_hp).toBeNull();
    expect(guruSchema.safeParse({ nama: "Ust. A", no_hp: "abc" }).success).toBe(false);
  });

  it("generus: kelas wajib, tanggal lahir opsional", () => {
    const g = generusSchema.parse({ nama: "Bilal", jenis_kelamin: "laki_laki", kelas_id: UUID });
    expect(g.tanggal_lahir).toBeUndefined();
    expect(g.status).toBe("aktif");
    expect(generusSchema.safeParse({ nama: "Bilal", jenis_kelamin: "laki_laki" }).success).toBe(false);
  });

  it("materi: 'semua' disimpan sebagai null", () => {
    const m = materiSchema.parse({ aspek: "mandiri", mapel: "Kemandirian", nama: "Instalasi listrik", jenis_kelamin: "laki_laki" });
    expect(m.jenjang).toBeNull();
    expect(m.jenis_kelamin).toBe("laki_laki");
    expect(m.aktif).toBe(true);
  });

  it("kitab: jumlah halaman angka positif", () => {
    expect(kitabSchema.parse({ nama: "K. Janaiz", total_satuan: "120" }).total_satuan).toBe(120);
    expect(kitabSchema.safeParse({ nama: "K. Janaiz", total_satuan: "0" }).success).toBe(false);
  });
});
