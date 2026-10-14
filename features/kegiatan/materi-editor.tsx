"use client";

import { ChevronDown, Plus, Search, Trash2 } from "lucide-react";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { AksiBawah, FormError, SubmitButton } from "@/components/form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { SimpanState } from "./actions";
import { PilihMateriItem } from "./pilih-materi-item";
import type { OpsiMateriItem } from "./queries";

type Kitab = { id: string; nama: string; jenis: "quran" | "hadist"; total_satuan: number };
type Surat = { nomor: number; nama_latin: string; jumlah_ayat: number };
type MateriAwal = {
  kitab_id: string;
  jenis: "makna" | "bacaan";
  mulai: number;
  selesai: number;
  mulai_surat: number | null;
  mulai_ayat: number | null;
  selesai_surat: number | null;
  selesai_ayat: number | null;
};
type RundownAwal = { waktu: string | null; aktivitas: string };

type Baris = {
  key: number;
  kitab_id: string;
  jenis: "makna" | "bacaan";
  mulai: string;
  selesai: string;
  mulai_surat: number | null;
  mulai_ayat: string;
  selesai_surat: number | null;
  selesai_ayat: string;
};

let kunci = 0;
const baru = (kitab_id = ""): Baris => ({
  key: ++kunci,
  kitab_id,
  jenis: "makna",
  mulai: "",
  selesai: "",
  mulai_surat: null,
  mulai_ayat: "",
  selesai_surat: null,
  selesai_ayat: "",
});

const angka = (s: string) => (s.trim() === "" ? null : Number(s));

export function MateriEditor({ kitab, surat, awal, rundownAwal, opsiItem, itemAwal, action }: {
  kitab: Kitab[];
  surat: Surat[];
  awal: MateriAwal[];
  rundownAwal: RundownAwal[];
  opsiItem: OpsiMateriItem[];
  itemAwal: string[];
  action: (prev: SimpanState, fd: FormData) => Promise<SimpanState>;
}) {
  const [baris, setBaris] = useState<Baris[]>(() =>
    awal.length
      ? awal.map((m) => ({
          key: ++kunci,
          kitab_id: m.kitab_id,
          jenis: m.jenis,
          mulai: m.mulai_surat ? "" : String(m.mulai),
          selesai: m.mulai_surat ? "" : String(m.selesai),
          mulai_surat: m.mulai_surat,
          mulai_ayat: m.mulai_ayat ? String(m.mulai_ayat) : "",
          selesai_surat: m.selesai_surat,
          selesai_ayat: m.selesai_ayat ? String(m.selesai_ayat) : "",
        }))
      : [baru(kitab.length === 1 ? kitab[0].id : "")],
  );
  const [rundown, setRundown] = useState(() =>
    rundownAwal.map((r) => ({ key: ++kunci, waktu: r.waktu?.slice(0, 5) ?? "", aktivitas: r.aktivitas })),
  );
  const [items, setItems] = useState<string[]>(itemAwal);
  const [state, formAction] = useActionState(action, {});

  useEffect(() => {
    if (state.ok) toast.success(state.ok);
  }, [state]);

  const ubah = (key: number, patch: Partial<Baris>) => setBaris((s) => s.map((b) => (b.key === key ? { ...b, ...patch } : b)));
  const kitabById = useMemo(() => new Map(kitab.map((k) => [k.id, k])), [kitab]);

  // Baris tanpa rentang sama sekali diabaikan, agar kegiatan yang hanya membahas
  // materi item (mis. Faqih/Akhlaq) tetap bisa disimpan. Baris setengah terisi tetap divalidasi SQL.
  const kosong = (b: Baris) => !b.mulai && !b.selesai && !b.mulai_ayat && !b.selesai_ayat;
  const json = JSON.stringify(
    baris
      .filter((b) => b.kitab_id && !kosong(b))
      .map((b) =>
        kitabById.get(b.kitab_id)?.jenis === "quran"
          ? {
              kitab_id: b.kitab_id,
              jenis: b.jenis,
              mulai_surat: b.mulai_surat,
              mulai_ayat: angka(b.mulai_ayat),
              selesai_surat: b.selesai_surat ?? b.mulai_surat,
              selesai_ayat: angka(b.selesai_ayat),
            }
          : { kitab_id: b.kitab_id, jenis: "makna", mulai: angka(b.mulai), selesai: angka(b.selesai) },
      ),
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="materi" value={json} />
      <input type="hidden" name="materi_item" value={JSON.stringify(items)} />
      <input type="hidden" name="rundown" value={JSON.stringify(rundown.map(({ waktu, aktivitas }) => ({ waktu, aktivitas })))} />

      {baris.map((b, i) => (
        <BarisMateri
          key={b.key}
          nomor={i + 1}
          b={b}
          kitab={kitab}
          surat={surat}
          ubah={(p) => ubah(b.key, p)}
          hapus={baris.length > 1 ? () => setBaris((s) => s.filter((x) => x.key !== b.key)) : undefined}
        />
      ))}

      <Button type="button" variant="outline" className="w-full lg:w-fit" onClick={() => setBaris((s) => [...s, baru(s.at(-1)?.kitab_id)])}>
        <Plus aria-hidden />
        Tambah baris materi
      </Button>

      <PilihMateriItem opsi={opsiItem} dipilih={items} onChange={setItems} />

      <details className="group rounded-2xl border-[1.5px] border-input bg-card" open={rundown.length > 0 || undefined}>
        <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between px-4 text-lg font-semibold">
          <span>
            Rundown <span className="font-normal text-muted-foreground">(opsional)</span>
          </span>
          <ChevronDown aria-hidden className="ml-auto size-6 transition-transform group-open:rotate-180" />
        </summary>
        <div className="flex flex-col gap-3 border-t px-4 py-4">
          {rundown.map((r, i) => (
            <div key={r.key} className="flex items-end gap-2">
              <label className="flex w-30 shrink-0 flex-col gap-1">
                <span className="text-base font-semibold">{i === 0 ? "Waktu" : <span className="sr-only">Waktu</span>}</span>
                <Input
                  type="time"
                  value={r.waktu}
                  onChange={(e) => setRundown((s) => s.map((x) => (x.key === r.key ? { ...x, waktu: e.target.value } : x)))}
                />
              </label>
              <label className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="text-base font-semibold">{i === 0 ? "Aktivitas" : <span className="sr-only">Aktivitas</span>}</span>
                <Input
                  value={r.aktivitas}
                  placeholder="mis. Pembukaan, Makna Al-Qur'an"
                  onChange={(e) => setRundown((s) => s.map((x) => (x.key === r.key ? { ...x, aktivitas: e.target.value } : x)))}
                />
              </label>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Hapus baris rundown"
                onClick={() => setRundown((s) => s.filter((x) => x.key !== r.key))}
              >
                <Trash2 aria-hidden />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            className="w-fit"
            onClick={() => setRundown((s) => [...s, { key: ++kunci, waktu: "", aktivitas: "" }])}
          >
            <Plus aria-hidden />
            Tambah rundown
          </Button>
        </div>
      </details>

      <FormError error={state.error} />
      <AksiBawah>
        <SubmitButton>Simpan Materi</SubmitButton>
      </AksiBawah>
    </form>
  );
}

function BarisMateri({ nomor, b, kitab, surat, ubah, hapus }: {
  nomor: number;
  b: Baris;
  kitab: Kitab[];
  surat: Surat[];
  ubah: (p: Partial<Baris>) => void;
  hapus?: () => void;
}) {
  const k = kitab.find((x) => x.id === b.kitab_id);
  const quran = k?.jenis === "quran";

  return (
    <fieldset className="flex flex-col gap-4 rounded-2xl border-[1.5px] border-input bg-card p-3.5">
      <div className="flex items-center justify-between">
        <legend className="text-lg font-semibold">Materi {nomor}</legend>
        {hapus && (
          <Button type="button" variant="ghost" size="icon" aria-label={`Hapus materi ${nomor}`} onClick={hapus}>
            <Trash2 aria-hidden />
          </Button>
        )}
      </div>

      <div role="group" aria-label="Kitab" className="flex flex-wrap gap-2">
        {kitab.map((x) => (
          <button
            key={x.id}
            type="button"
            aria-pressed={b.kitab_id === x.id}
            onClick={() => ubah({ kitab_id: x.id, jenis: x.jenis === "quran" ? b.jenis : "makna" })}
            className={cn(
              "min-h-12 rounded-xl border-[1.5px] px-4 text-base font-semibold",
              b.kitab_id === x.id ? "border-2 border-primary bg-mint text-mint-foreground" : "border-input bg-card",
            )}
          >
            {x.nama}
          </button>
        ))}
      </div>

      {quran && (
        <div role="group" aria-label="Jenis materi" className="grid grid-cols-2 gap-1 rounded-xl bg-secondary p-1">
          {(["makna", "bacaan"] as const).map((j) => (
            <button
              key={j}
              type="button"
              aria-pressed={b.jenis === j}
              onClick={() => ubah({ jenis: j })}
              className={cn("h-12 rounded-lg text-base font-medium text-[#444444]", b.jenis === j && "bg-card font-semibold text-primary shadow-sm")}
            >
              {j === "makna" ? "Makna" : "Bacaan"}
            </button>
          ))}
        </div>
      )}

      {k && !quran && (
        <div className="grid grid-cols-2 gap-3">
          <AngkaBesar label="Dari hal." value={b.mulai} onChange={(v) => ubah({ mulai: v })} max={k.total_satuan} />
          <AngkaBesar label="Sampai hal." value={b.selesai} onChange={(v) => ubah({ selesai: v })} max={k.total_satuan} />
          <p className="col-span-2 text-muted-foreground">Kitab ini {k.total_satuan} halaman.</p>
          {angka(b.mulai) != null && angka(b.selesai) != null && angka(b.mulai)! > angka(b.selesai)! && (
            <p className="col-span-2 font-medium text-destructive">&quot;Sampai&quot; harus sesudah &quot;dari&quot;.</p>
          )}
        </div>
      )}

      {quran && (
        <div className="flex flex-col gap-4">
          <PosisiAyat
            label="Dari"
            surat={surat}
            nomorSurat={b.mulai_surat}
            ayat={b.mulai_ayat}
            onSurat={(n) => ubah({ mulai_surat: n, selesai_surat: b.selesai_surat ?? n })}
            onAyat={(v) => ubah({ mulai_ayat: v })}
          />
          <PosisiAyat
            label="Sampai"
            surat={surat}
            nomorSurat={b.selesai_surat ?? b.mulai_surat}
            ayat={b.selesai_ayat}
            onSurat={(n) => ubah({ selesai_surat: n })}
            onAyat={(v) => ubah({ selesai_ayat: v })}
          />
        </div>
      )}

      {!k && <p className="text-muted-foreground">Pilih kitab terlebih dahulu.</p>}
    </fieldset>
  );
}

function AngkaBesar({ label, value, onChange, max }: { label: string; value: string; onChange: (v: string) => void; max?: number }) {
  const lebih = max != null && angka(value) != null && angka(value)! > max;
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-base font-semibold">{label}</span>
      <Input
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
        aria-invalid={lebih || undefined}
        className="h-14 text-center text-xl font-semibold tabular-nums"
      />
      {lebih && <span className="font-medium text-destructive">Melebihi {max}.</span>}
    </label>
  );
}

function PosisiAyat({ label, surat, nomorSurat, ayat, onSurat, onAyat }: {
  label: string;
  surat: Surat[];
  nomorSurat: number | null;
  ayat: string;
  onSurat: (n: number) => void;
  onAyat: (v: string) => void;
}) {
  const s = surat.find((x) => x.nomor === nomorSurat);
  const lebih = s && angka(ayat) != null && angka(ayat)! > s.jumlah_ayat;
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-base font-semibold">{label}</span>
      <div className="flex gap-2">
        <PilihSurat surat={surat} nomor={nomorSurat} onPilih={onSurat} />
        <label className="w-24 shrink-0">
          <span className="sr-only">{label} ayat</span>
          <Input
            inputMode="numeric"
            placeholder="Ayat"
            value={ayat}
            onChange={(e) => onAyat(e.target.value.replace(/\D/g, ""))}
            aria-invalid={lebih || undefined}
            className="h-14 text-center text-xl font-semibold tabular-nums"
          />
        </label>
      </div>
      {s && <span className={cn("text-muted-foreground", lebih && "font-medium text-destructive")}>dari {s.jumlah_ayat} ayat</span>}
    </div>
  );
}

/** Daftar 114 surat dengan pencarian nama/nomor (DESIGN §6). */
function PilihSurat({ surat, nomor, onPilih }: { surat: Surat[]; nomor: number | null; onPilih: (n: number) => void }) {
  const [buka, setBuka] = useState(false);
  const [cari, setCari] = useState("");
  const dipilih = surat.find((s) => s.nomor === nomor);
  const aktifRef = useRef<HTMLButtonElement>(null);

  const kata = cari.trim().toLowerCase().replace(/[-' ]/g, "");
  const hasil = surat.filter(
    (s) => !kata || String(s.nomor) === kata || s.nama_latin.toLowerCase().replace(/[-' ]/g, "").includes(kata),
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setBuka(true)}
        className="flex h-14 min-w-0 flex-1 items-center justify-between gap-2 rounded-lg border border-input bg-card px-3 text-left text-lg"
      >
        <span className={cn("truncate", !dipilih && "text-muted-foreground")}>
          {dipilih ? `${dipilih.nomor} · ${dipilih.nama_latin}` : "Pilih surat"}
        </span>
        <ChevronDown aria-hidden className="size-5 shrink-0" />
      </button>
      <Dialog
        open={buka}
        onOpenChange={(v) => {
          setBuka(v);
          if (!v) setCari("");
        }}
      >
        <DialogContent
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            aktifRef.current?.scrollIntoView({ block: "center" });
          }}
        >
          <DialogHeader>
            <DialogTitle>Pilih surat</DialogTitle>
          </DialogHeader>
          <label className="flex h-12 items-center gap-2 rounded-xl border-[1.5px] border-input bg-card px-3">
            <Search aria-hidden className="size-5 text-muted-foreground" />
            <span className="sr-only">Cari surat</span>
            <input
              type="search"
              value={cari}
              onChange={(e) => setCari(e.target.value)}
              placeholder="Nama atau nomor surat…"
              className="h-full min-w-0 flex-1 bg-transparent text-lg outline-none"
            />
          </label>
          <ul className="-mx-1 flex max-h-[50dvh] flex-col gap-1 overflow-y-auto px-1">
            {hasil.map((s) => (
              <li key={s.nomor}>
                <button
                  ref={s.nomor === nomor ? aktifRef : undefined}
                  type="button"
                  onClick={() => {
                    onPilih(s.nomor);
                    setBuka(false);
                    setCari("");
                  }}
                  className={cn(
                    "flex min-h-13 w-full items-center justify-between gap-2 rounded-xl px-3 text-left hover:bg-mint",
                    s.nomor === nomor && "bg-mint font-semibold text-mint-foreground",
                  )}
                >
                  <span className="text-lg">
                    <span className="inline-block w-10 tabular-nums text-muted-foreground">{s.nomor}</span>
                    {s.nama_latin}
                  </span>
                  <span className="shrink-0 text-muted-foreground">{s.jumlah_ayat} ayat</span>
                </button>
              </li>
            ))}
            {hasil.length === 0 && <li className="px-3 py-2 text-muted-foreground">Tidak ditemukan.</li>}
          </ul>
        </DialogContent>
      </Dialog>
    </>
  );
}
