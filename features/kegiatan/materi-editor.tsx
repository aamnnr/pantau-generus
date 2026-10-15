"use client";

import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { AksiBawah, FormError, SubmitButton } from "@/components/form";
import {
  barisBaru,
  barisDariAwal,
  barisKeJson,
  BarisRentang,
  kunciBaru,
  type Baris,
  type Kitab,
  type RentangAwal,
  type Surat,
} from "@/components/rentang-kitab";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SimpanState } from "./actions";
import { PilihMateriItem } from "./pilih-materi-item";
import type { OpsiMateriItem } from "./queries";

type RundownAwal = { waktu: string | null; aktivitas: string };

export function MateriEditor({ kitab, surat, awal, rundownAwal, opsiItem, itemAwal, tanpaKitab = false, action }: {
  kitab: Kitab[];
  surat: Surat[];
  awal: RentangAwal[];
  rundownAwal: RundownAwal[];
  opsiItem: OpsiMateriItem[];
  itemAwal: string[];
  /** Kegiatan khusus Caberawit: tanpa makna/bacaan Al-Qur'an & Al-Hadist (PRD §5). */
  tanpaKitab?: boolean;
  action: (prev: SimpanState, fd: FormData) => Promise<SimpanState>;
}) {
  const [baris, setBaris] = useState<Baris[]>(() =>
    awal.length ? awal.map(barisDariAwal) : tanpaKitab ? [] : [barisBaru(kitab.length === 1 ? kitab[0].id : "")],
  );
  const [rundown, setRundown] = useState(() =>
    rundownAwal.map((r) => ({ key: kunciBaru(), waktu: r.waktu?.slice(0, 5) ?? "", aktivitas: r.aktivitas })),
  );
  const [items, setItems] = useState<string[]>(itemAwal);
  const [state, formAction] = useActionState(action, {});

  useEffect(() => {
    if (state.ok) toast.success(state.ok);
  }, [state]);

  const ubah = (key: number, patch: Partial<Baris>) => setBaris((s) => s.map((b) => (b.key === key ? { ...b, ...patch } : b)));

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {/* Baris tanpa rentang diabaikan agar kegiatan yang hanya membahas materi item tetap bisa disimpan. */}
      <input type="hidden" name="materi" value={JSON.stringify(barisKeJson(baris, kitab))} />
      <input type="hidden" name="materi_item" value={JSON.stringify(items)} />
      <input type="hidden" name="rundown" value={JSON.stringify(rundown.map(({ waktu, aktivitas }) => ({ waktu, aktivitas })))} />

      {tanpaKitab && baris.length === 0 && (
        <p className="rounded-xl border border-info/20 bg-info-soft px-3.5 py-2.5 text-sm text-info">
          Caberawit tidak memakai makna Al-Qur&apos;an/Al-Hadist. Catat hafalan, latihan makna, dan materi lain lewat butir materi di bawah.
        </p>
      )}

      {baris.map((b, i) => (
        <BarisRentang
          key={b.key}
          judul={`Materi ${i + 1}`}
          b={b}
          kitab={kitab}
          surat={surat}
          ubah={(p) => ubah(b.key, p)}
          hapus={baris.length > 1 || tanpaKitab ? () => setBaris((s) => s.filter((x) => x.key !== b.key)) : undefined}
        />
      ))}

      {(!tanpaKitab || baris.length > 0) && (
        <Button type="button" variant="outline" className="w-full lg:w-fit" onClick={() => setBaris((s) => [...s, barisBaru(s.at(-1)?.kitab_id)])}>
          <Plus aria-hidden />
          Tambah baris materi
        </Button>
      )}

      <PilihMateriItem opsi={opsiItem} dipilih={items} onChange={setItems} />

      <details className="group rounded-2xl border border-input bg-card" open={rundown.length > 0 || undefined}>
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between rounded-2xl px-4 text-base font-semibold hover:bg-muted">
          <span>
            Rundown <span className="font-normal text-muted-foreground">(opsional)</span>
          </span>
          <ChevronDown aria-hidden className="ml-auto size-5 transition-transform duration-250 ease-(--ease-halus) group-open:rotate-180" />
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
            onClick={() => setRundown((s) => [...s, { key: kunciBaru(), waktu: "", aktivitas: "" }])}
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
