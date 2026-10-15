"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AksiBawah, FormError, SubmitButton } from "@/components/form";
import { Kosong } from "@/components/page";
import { CHIP_PRESENSI, StatusChip } from "@/components/status-chip";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { inisial, LABEL_PRESENSI, URUTAN_PRESENSI, type StatusPresensi } from "@/lib/format";
import { getar } from "@/lib/getar";
import { cn } from "@/lib/utils";
import type { SimpanState } from "./actions";
import type { KelasRingkas, Peserta } from "./queries";

type Isian = { status: StatusPresensi; keterangan: string };

const WARNA_TOMBOL: Record<StatusPresensi, string> = {
  hadir: "border-ok bg-ok-soft text-ok",
  terlambat: "border-warn bg-warn-soft text-warn",
  izin: "border-info bg-info-soft text-info",
  sakit: "border-ungu bg-ungu-soft text-ungu",
  alpa: "border-bahaya bg-bahaya-soft text-bahaya",
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

  // Jumlah perubahan yang belum disimpan dibanding data dari server.
  const berubah = peserta.filter(
    (p) => isian[p.id].status !== (p.status ?? "hadir") || (isian[p.id].keterangan || "") !== (p.keterangan ?? ""),
  ).length;

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
        <p className="rounded-xl border border-primary/20 bg-mint px-3.5 py-2.5 text-base text-mint-foreground">
          Semua ditandai <strong>Hadir</strong>. Ketuk nama anak yang tidak hadir.
        </p>
      )}

      <ul className="flex flex-wrap gap-1.5" aria-live="polite" aria-label="Ringkasan kehadiran">
        {URUTAN_PRESENSI.map((s) => (
          <li key={s}>
            <StatusChip nada={jumlah[s] ? CHIP_PRESENSI[s].nada : "abu"} simbol={CHIP_PRESENSI[s].simbol} className={cn(!jumlah[s] && "opacity-60")}>
              {LABEL_PRESENSI[s]} <span key={jumlah[s]} className="inline-block animate-pop tabular-nums">{jumlah[s]}</span>
            </StatusChip>
          </li>
        ))}
      </ul>

      {kelompok
        .filter((g) => g.isi.length)
        .map((g) => (
          <section key={g.judul} className="flex flex-col gap-2">
            {g.judul && <h3 className="pt-1 text-base font-semibold text-teks-2">{g.judul}</h3>}
            <ul className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-1 2xl:grid-cols-2">
              {g.isi.map((p) => {
                const st = isian[p.id].status;
                const chip = CHIP_PRESENSI[st];
                const isi = (
                  <>
                    <span
                      aria-hidden
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors duration-200",
                        st === "hadir" ? "bg-mint text-mint-foreground" : "bg-secondary text-teks-2",
                      )}
                    >
                      {inisial(p.nama)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-base font-medium">{p.nama}</span>
                      {isian[p.id].keterangan && <span className="block truncate text-sm text-muted-foreground">{isian[p.id].keterangan}</span>}
                    </span>
                    <StatusChip key={st} nada={chip.nada} simbol={chip.simbol} className="animate-pop">
                      {LABEL_PRESENSI[st]}
                    </StatusChip>
                  </>
                );
                const kelasBaris = cn(
                  "flex min-h-12 w-full items-center gap-3 rounded-xl border bg-card px-3 py-2 text-left",
                  st !== "hadir" && "border-l-[3px] border-l-kunyit",
                );
                return (
                  <li key={p.id}>
                    {bisaUbah ? (
                      <button type="button" onClick={() => setAktif(p)} className={cn(kelasBaris, "transition-[background-color,border-color,transform] duration-150 hover:bg-muted active:scale-[0.99]")}>
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
            {berubah > 0 && sudahDisimpan && (
              <p className="animate-muncul text-center text-sm font-medium text-warn lg:mr-auto lg:self-center">
                {berubah} perubahan belum disimpan
              </p>
            )}
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
                      getar();
                      setIsian((x) => ({ ...x, [aktif.id]: { ...x[aktif.id], status: s } }));
                      // Hadir tidak butuh keterangan → langsung tutup agar cepat.
                      if (s === "hadir") setAktif(null);
                    }}
                    className={cn(
                      "flex min-h-12 items-center justify-center gap-2 rounded-xl border text-base font-semibold transition-[background-color,border-color,transform] duration-150 active:scale-[0.97]",
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
