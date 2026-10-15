"use client";

import { Plus } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { AksiBawah, FormError, SubmitButton } from "@/components/form";
import {
  barisBaru,
  barisDariAwal,
  barisKeJson,
  BarisRentang,
  type Baris,
  type Kitab,
  type RentangAwal,
  type Surat,
} from "@/components/rentang-kitab";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KartuItem } from "@/features/kegiatan/pilih-materi-item";
import type { OpsiMateriItem } from "@/features/kegiatan/queries";
import { LABEL_ASPEK, URUTAN_ASPEK, type Aspek } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { SimpanState } from "./actions";

/**
 * Isi target mengikuti dokumen PPG (DESIGN §7.6):
 * Alim (Bacaan Al-Qur'an, Makna, Hafalan) · Faqih · Akhlaqul Karimah · Mandiri (+ Tilawati Caberawit).
 */
export function IsiTargetEditor({ kitab, surat, awalKitab, opsiMateri, awalMateri, jilid, awalTilawati, adaCaberawit, action }: {
  kitab: Kitab[];
  surat: Surat[];
  awalKitab: RentangAwal[];
  opsiMateri: OpsiMateriItem[];
  awalMateri: string[];
  jilid: { jilid: number; total_halaman: number }[];
  awalTilawati: { jilid: number; halaman: number } | null;
  adaCaberawit: boolean;
  action: (prev: SimpanState, fd: FormData) => Promise<SimpanState>;
}) {
  const quran = kitab.filter((k) => k.jenis === "quran");
  const [bacaan, setBacaan] = useState<Baris[]>(() => awalKitab.filter((x) => x.jenis === "bacaan").map(barisDariAwal));
  const [makna, setMakna] = useState<Baris[]>(() => awalKitab.filter((x) => x.jenis === "makna").map(barisDariAwal));
  const [materi, setMateri] = useState<string[]>(awalMateri);
  const [tilawati, setTilawati] = useState({
    jilid: awalTilawati ? String(awalTilawati.jilid) : "",
    halaman: awalTilawati ? String(awalTilawati.halaman) : "",
  });
  const [state, formAction] = useActionState(action, {});

  useEffect(() => {
    if (state.ok) toast.success(state.ok);
  }, [state]);

  const ubah = (set: typeof setBacaan) => (key: number, p: Partial<Baris>) =>
    set((s) => s.map((b) => (b.key === key ? { ...b, ...p } : b)));
  const toggle = (id: string) => setMateri((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const isi = {
    kitab: [...barisKeJson(bacaan, kitab), ...barisKeJson(makna, kitab)],
    materi_item: materi,
    tilawati: tilawati.jilid ? { jilid: Number(tilawati.jilid), halaman: Number(tilawati.halaman || 0) } : null,
  };

  const bagianMateri = (aspek: Aspek) => {
    const opsi = opsiMateri.filter((o) => o.aspek === aspek);
    if (opsi.length === 0) {
      return <p className="text-muted-foreground">Belum ada butir {LABEL_ASPEK[aspek]}. Tambahkan di Kelola → Materi.</p>;
    }
    const mapel = [...new Set(opsi.map((o) => o.mapel))];
    return mapel.map((mp) => (
      <div key={mp} className="flex flex-col gap-2">
        <p className="font-semibold text-muted-foreground">{mp}</p>
        {opsi
          .filter((o) => o.mapel === mp)
          .map((o) => (
            <KartuItem key={o.id} o={o} aktif={materi.includes(o.id)} onToggle={() => toggle(o.id)} />
          ))}
      </div>
    ));
  };

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="isi" value={JSON.stringify(isi)} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2 xl:items-start">
        <Bagian judul="Alim" sub="Bacaan, keilmuan (makna), dan hafalan">
          <h3 className="text-lg font-semibold">Bacaan Al-Qur&apos;an</h3>
          {bacaan.map((b, i) => (
            <BarisRentang
              key={b.key}
              judul={`Bacaan ${i + 1}`}
              b={b}
              kitab={quran}
              surat={surat}
              jenisTetap="bacaan"
              ubah={(p) => ubah(setBacaan)(b.key, p)}
              hapus={() => setBacaan((s) => s.filter((x) => x.key !== b.key))}
            />
          ))}
          <Button
            type="button"
            variant="outline"
            className="w-full lg:w-fit"
            onClick={() => setBacaan((s) => [...s, barisBaru(quran[0]?.id, "bacaan")])}
          >
            <Plus aria-hidden />
            Tambah target bacaan
          </Button>

          <h3 className="pt-2 text-lg font-semibold">Makna (keilmuan)</h3>
          {makna.map((b, i) => (
            <BarisRentang
              key={b.key}
              judul={`Makna ${i + 1}`}
              b={b}
              kitab={kitab}
              surat={surat}
              jenisTetap="makna"
              ubah={(p) => ubah(setMakna)(b.key, p)}
              hapus={() => setMakna((s) => s.filter((x) => x.key !== b.key))}
            />
          ))}
          <Button type="button" variant="outline" className="w-full lg:w-fit" onClick={() => setMakna((s) => [...s, barisBaru("", "makna")])}>
            <Plus aria-hidden />
            Tambah target makna
          </Button>

          <h3 className="pt-2 text-lg font-semibold">Hafalan</h3>
          {bagianMateri("alim")}
        </Bagian>

        <div className="flex flex-col gap-6">
          {URUTAN_ASPEK.filter((a) => a !== "alim").map((a) => (
            <Bagian key={a} judul={LABEL_ASPEK[a]}>
              {bagianMateri(a)}
            </Bagian>
          ))}

          {adaCaberawit && (
            <Bagian judul="Tilawati" sub="Target posisi baca anak Caberawit di akhir periode">
              <div className="flex flex-col gap-2">
                <p className="font-semibold">Jilid</p>
                {jilid.length ? (
                  <div role="group" aria-label="Jilid" className="flex flex-wrap gap-2">
                    {[{ jilid: 0, total_halaman: 0 }, ...jilid].map((j) => {
                      const nilai = j.jilid ? String(j.jilid) : "";
                      return (
                        <button
                          key={j.jilid}
                          type="button"
                          aria-pressed={tilawati.jilid === nilai}
                          onClick={() => setTilawati((t) => ({ ...t, jilid: nilai }))}
                          className={cn(
                            "min-h-10 min-w-14 rounded-lg border px-4 text-base font-semibold",
                            tilawati.jilid === nilai ? "border-primary bg-mint text-mint-foreground" : "border-input bg-card",
                          )}
                        >
                          {j.jilid ? j.jilid : "Tanpa target"}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Atur jilid dulu di Kelola → Jilid Tilawati.</p>
                )}
              </div>
              {tilawati.jilid && (
                <label className="flex max-w-48 flex-col gap-1.5">
                  <span className="font-semibold">Sampai halaman</span>
                  <Input
                    inputMode="numeric"
                    value={tilawati.halaman}
                    onChange={(e) => setTilawati((t) => ({ ...t, halaman: e.target.value.replace(/\D/g, "") }))}
                    className="h-11 text-center text-xl font-semibold tabular-nums"
                  />
                  <span className="text-muted-foreground">
                    dari {jilid.find((j) => String(j.jilid) === tilawati.jilid)?.total_halaman ?? "?"} halaman
                  </span>
                </label>
              )}
            </Bagian>
          )}
        </div>
      </div>

      <FormError error={state.error} />
      <AksiBawah>
        <SubmitButton>Simpan Target</SubmitButton>
      </AksiBawah>
    </form>
  );
}

function Bagian({ judul, sub, children }: { judul: string; sub?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl bg-card p-4 border lg:p-5">
      <div className="border-b pb-2">
        <h2 className="text-lg font-semibold text-primary">{judul}</h2>
        {sub && <p className="text-muted-foreground">{sub}</p>}
      </div>
      {children}
    </section>
  );
}
