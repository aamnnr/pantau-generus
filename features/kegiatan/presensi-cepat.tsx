"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AksiBawah, FormError, SubmitButton } from "@/components/form";
import { Kosong } from "@/components/page";
import { CHIP_PRESENSI, StatusChip } from "@/components/status-chip";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { LABEL_PRESENSI, URUTAN_PRESENSI, type StatusPresensi } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { SimpanState } from "./actions";
import type { KelasRingkas, Peserta } from "./queries";

type Isian = { status: StatusPresensi; keterangan: string };

const WARNA_TOMBOL: Record<StatusPresensi, string> = {
  hadir: "border-[#0b5f31] bg-[#e3f4e9] text-[#0b5f31]",
  terlambat: "border-[#8a4b00] bg-[#fff1de] text-[#8a4b00]",
  izin: "border-[#1f4e8c] bg-[#e4eefb] text-[#1f4e8c]",
  sakit: "border-[#5e2a86] bg-[#f0e7f8] text-[#5e2a86]",
  alpa: "border-[#a61b1b] bg-[#fdecec] text-[#a61b1b]",
};

export function PresensiCepat({ peserta, kelas, action, bisaUbah }: {
  peserta: Peserta[];
  kelas: KelasRingkas[];
  action: (prev: SimpanState, fd: FormData) => Promise<SimpanState>;
  bisaUbah: boolean;
}) {
  const sudahDisimpan = peserta.some((p) => p.status);
  const [isian, setIsian] = useState<Record<string, Isian>>(() =>
    Object.fromEntries(peserta.map((p) => [p.id, { status: p.status ?? "hadir", keterangan: p.keterangan ?? "" }])),
  );
  const [aktif, setAktif] = useState<Peserta | null>(null);
  const [state, formAction] = useActionState(action, {});

  useEffect(() => {
    if (state.ok) toast.success(state.ok);
  }, [state]);

  const jumlah = useMemo(() => {
    const j = Object.fromEntries(URUTAN_PRESENSI.map((s) => [s, 0])) as Record<StatusPresensi, number>;
    for (const v of Object.values(isian)) j[v.status]++;
    return j;
  }, [isian]);

  if (peserta.length === 0) {
    return <Kosong judul="Belum ada anak aktif di kelas ini" keterangan="Tambahkan generus ke kelas melalui menu Generus." />;
  }

  // Kegiatan gabungan: nama dikelompokkan per kelas (DESIGN §7.3).
  const kelompok = kelas.length > 1
    ? [...kelas.map((k) => ({ judul: k.nama, isi: peserta.filter((p) => p.kelasId === k.id) })),
       { judul: "Lainnya", isi: peserta.filter((p) => !kelas.some((k) => k.id === p.kelasId)) }]
    : [{ judul: "", isi: peserta }];

  const json = JSON.stringify(
    peserta.map((p) => ({ generus_id: p.id, status: isian[p.id].status, keterangan: isian[p.id].keterangan || undefined })),
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="presensi" value={json} />

      {!sudahDisimpan && bisaUbah && (
        <p className="rounded-2xl bg-mint px-4 py-3 text-mint-foreground">
          Semua ditandai <strong>Hadir</strong>. Ketuk nama anak yang tidak hadir.
        </p>
      )}

      <p className="flex flex-wrap gap-x-3 gap-y-1 text-base font-medium" aria-live="polite">
        {URUTAN_PRESENSI.map((s) => (
          <span key={s}>
            {LABEL_PRESENSI[s]} <strong className="tabular-nums">{jumlah[s]}</strong>
          </span>
        ))}
      </p>

      {kelompok
        .filter((g) => g.isi.length)
        .map((g) => (
          <section key={g.judul} className="flex flex-col gap-2">
            {g.judul && <h3 className="pt-1 text-lg font-semibold text-muted-foreground">{g.judul}</h3>}
            <ul className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-1 2xl:grid-cols-2">
              {g.isi.map((p) => {
                const st = isian[p.id].status;
                const chip = CHIP_PRESENSI[st];
                const isi = (
                  <>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-lg font-medium">{p.nama}</span>
                      {isian[p.id].keterangan && <span className="block truncate text-muted-foreground">{isian[p.id].keterangan}</span>}
                    </span>
                    <StatusChip nada={chip.nada} simbol={chip.simbol}>
                      {LABEL_PRESENSI[st]}
                    </StatusChip>
                  </>
                );
                const kelasBaris = cn(
                  "flex min-h-16 w-full items-center gap-3 rounded-2xl bg-card px-4 py-2 text-left shadow-[0_1px_2px_rgba(18,20,19,0.06)]",
                  st !== "hadir" && "ring-1 ring-inset ring-input",
                );
                return (
                  <li key={p.id}>
                    {bisaUbah ? (
                      <button type="button" onClick={() => setAktif(p)} className={cn(kelasBaris, "hover:bg-mint/60")}>
                        {isi}
                      </button>
                    ) : (
                      <div className={kelasBaris}>{isi}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}

      {bisaUbah && (
        <>
          <FormError error={state.error} />
          <AksiBawah>
            <SubmitButton>Simpan Kehadiran</SubmitButton>
          </AksiBawah>
        </>
      )}

      <Dialog open={!!aktif} onOpenChange={(v) => !v && setAktif(null)}>
        {aktif && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{aktif.nama}</DialogTitle>
              <DialogDescription>Pilih status kehadiran.</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-2">
              {URUTAN_PRESENSI.map((s) => {
                const dipilih = isian[aktif.id].status === s;
                return (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={dipilih}
                    onClick={() => {
                      setIsian((x) => ({ ...x, [aktif.id]: { ...x[aktif.id], status: s } }));
                      // Hadir tidak butuh keterangan → langsung tutup agar cepat.
                      if (s === "hadir") setAktif(null);
                    }}
                    className={cn(
                      "flex min-h-16 items-center justify-center gap-2 rounded-2xl border-2 text-lg font-semibold",
                      s === "hadir" && "col-span-2",
                      dipilih ? WARNA_TOMBOL[s] : "border-input bg-card text-foreground",
                    )}
                  >
                    <span aria-hidden>{CHIP_PRESENSI[s].simbol}</span>
                    {LABEL_PRESENSI[s]}
                  </button>
                );
              })}
            </div>
            <label className="flex flex-col gap-2">
              <span className="text-base font-semibold">
                Keterangan <span className="font-normal text-muted-foreground">(opsional)</span>
              </span>
              <Textarea
                value={isian[aktif.id].keterangan}
                onChange={(e) => setIsian((x) => ({ ...x, [aktif.id]: { ...x[aktif.id], keterangan: e.target.value } }))}
                placeholder="mis. Izin acara keluarga"
                className="min-h-20"
              />
            </label>
            <Button type="button" size="lg" onClick={() => setAktif(null)}>
              Selesai
            </Button>
          </DialogContent>
        )}
      </Dialog>
    </form>
  );
}
