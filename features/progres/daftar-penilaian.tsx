"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { AksiBawah, FormError, SubmitButton } from "@/components/form";
import { CHIP_PENILAIAN, StatusChip } from "@/components/status-chip";
import { LABEL_ASPEK, labelPenilaian, URUTAN_ASPEK, type StatusPenilaian } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { SimpanState } from "./actions";
import type { BarisPenilaian } from "./queries";

const URUTAN: StatusPenilaian[] = ["belum", "proses", "lancar"];

const WARNA: Record<StatusPenilaian, string> = {
  belum: "bg-card text-[#444444] shadow-sm ring-2 ring-[#9a9a9a]",
  proses: "bg-[#fff1de] text-[#8a4b00] shadow-sm ring-2 ring-[#8a4b00]",
  lancar: "bg-[#e3f4e9] text-[#0b5f31] shadow-sm ring-2 ring-[#0b5f31]",
};

const kunci = (b: BarisPenilaian) => `${b.generus_id}:${b.materi_item_id}`;

/**
 * Penilaian tiga tingkat per baris (anak × butir), label mengikuti aspek (PRD F6).
 * Dipakai di Progres Anak (baris = butir) dan halaman Penilaian (baris = anak).
 * Hanya baris yang diubah yang dikirim; penilaian disimpan sebagai riwayat.
 */
export function DaftarPenilaian({ baris, action, bisa, perAspek }: {
  baris: BarisPenilaian[];
  action: (prev: SimpanState, fd: FormData) => Promise<SimpanState>;
  bisa: boolean;
  perAspek?: boolean;
}) {
  const [pilihan, setPilihan] = useState<Record<string, StatusPenilaian>>({});
  const [state, formAction] = useActionState(action, {});

  // Tanpa reset pilihan: setelah tersimpan, status dari server sama dengan pilihan sehingga baris tidak lagi "diubah".
  useEffect(() => {
    if (state.ok) toast.success(state.ok);
  }, [state]);

  const berubah = baris.filter((b) => pilihan[kunci(b)] && pilihan[kunci(b)] !== b.status);
  const json = JSON.stringify(berubah.map((b) => ({ generus_id: b.generus_id, materi_item_id: b.materi_item_id, status: pilihan[kunci(b)] })));

  const kelompok = perAspek
    ? URUTAN_ASPEK.map((a) => ({ judul: LABEL_ASPEK[a], isi: baris.filter((b) => b.aspek === a) })).filter((g) => g.isi.length)
    : [{ judul: "", isi: baris }];

  const daftar = kelompok.map((g) => (
    <section key={g.judul || "semua"} className="flex flex-col gap-2">
      {g.judul && <h3 className="pt-1 text-lg font-bold text-primary">{g.judul}</h3>}
      <ul className="@container flex flex-col gap-2">
        {g.isi.map((b) => {
          const k = kunci(b);
          const sekarang = pilihan[k] ?? b.status;
          const diubah = !!pilihan[k] && pilihan[k] !== b.status;
          return (
            <li
              key={k}
              className={cn(
                "flex flex-col gap-3 rounded-2xl bg-muted/60 p-3.5 @2xl:flex-row @2xl:items-center",
                diubah && "bg-[#fffaf2] ring-2 ring-kunyit",
              )}
            >
              <div className="min-w-0 flex-1">
                <p className="text-lg font-medium">{b.judul}</p>
                <p className="text-base text-muted-foreground">
                  {b.keterangan}
                  {b.target && " · Target periode ini"}
                  {diubah && <span className="font-semibold text-[#8a4b00]"> · belum disimpan</span>}
                </p>
              </div>
              {bisa ? (
                <div role="radiogroup" aria-label={`Penilaian ${b.judul}`} className="grid grid-cols-3 gap-1.5 rounded-2xl bg-secondary p-1 @2xl:w-[400px] @2xl:shrink-0">
                  {URUTAN.map((s) => (
                    <button
                      key={s}
                      type="button"
                      role="radio"
                      aria-checked={sekarang === s}
                      onClick={() => setPilihan((p) => ({ ...p, [k]: s }))}
                      className={cn(
                        "flex min-h-12 items-center justify-center gap-1.5 rounded-xl px-1 text-base font-medium text-[#444444]",
                        sekarang === s && cn("font-semibold", WARNA[s]),
                      )}
                    >
                      <span aria-hidden>{CHIP_PENILAIAN[s].simbol}</span>
                      {labelPenilaian(b.aspek, s)}
                    </button>
                  ))}
                </div>
              ) : (
                <StatusChip nada={CHIP_PENILAIAN[b.status ?? "belum"].nada} simbol={CHIP_PENILAIAN[b.status ?? "belum"].simbol}>
                  {b.status ? labelPenilaian(b.aspek, b.status) : "Belum dinilai"}
                </StatusChip>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  ));

  if (!bisa) return <div className="flex flex-col gap-4">{daftar}</div>;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="penilaian" value={json} />
      {daftar}
      <FormError error={state.error} />
      <AksiBawah>
        <SubmitButton disabled={berubah.length === 0}>
          {berubah.length ? `Simpan Penilaian (${berubah.length})` : "Simpan Penilaian"}
        </SubmitButton>
      </AksiBawah>
    </form>
  );
}
