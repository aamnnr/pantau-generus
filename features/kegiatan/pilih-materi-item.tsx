"use client";

import { Check, Plus, Search, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { StatusChip } from "@/components/status-chip";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LABEL_ASPEK, URUTAN_ASPEK } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { OpsiMateriItem } from "./queries";

/** Materi item (hafalan, faqih, akhlaq, mandiri) yang disampaikan ke seluruh peserta kegiatan. */
export function PilihMateriItem({ opsi, dipilih, onChange }: {
  opsi: OpsiMateriItem[];
  dipilih: string[];
  onChange: (ids: string[]) => void;
}) {
  const [buka, setBuka] = useState(false);
  const [cari, setCari] = useState("");
  const set = new Set(dipilih);
  const toggle = (id: string) => onChange(set.has(id) ? dipilih.filter((x) => x !== id) : [...dipilih, id]);

  const target = opsi.filter((o) => o.target);
  const lainDipilih = opsi.filter((o) => !o.target && set.has(o.id));
  const kata = cari.trim().toLowerCase();
  const hasil = opsi.filter((o) => !o.target && (!kata || `${o.nama} ${o.mapel}`.toLowerCase().includes(kata)));

  return (
    <section className="flex flex-col gap-3 rounded-2xl border-[1.5px] border-input bg-card p-3.5">
      <div>
        <h3 className="text-lg font-semibold">Materi lain yang disampaikan</h3>
        <p className="text-muted-foreground">Hafalan, Faqih, Akhlaq, Mandiri. Anak yang hadir tercatat sudah menerima materi ini.</p>
      </div>

      {opsi.length === 0 && (
        <p className="text-muted-foreground">
          Belum ada butir materi untuk jenjang ini.{" "}
          <Link href="/kelola/materi" className="font-semibold text-primary underline">
            Tambahkan di Kelola → Materi
          </Link>
          .
        </p>
      )}

      {target.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="font-semibold text-muted-foreground">Dari target periode ini</p>
          <ul className="grid grid-cols-1 gap-2">
            {target.map((o) => (
              <li key={o.id}>
                <KartuItem o={o} aktif={set.has(o.id)} onToggle={() => toggle(o.id)} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {lainDipilih.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="Materi lain terpilih">
          {lainDipilih.map((o) => (
            <li key={o.id}>
              <span className="inline-flex min-h-11 items-center gap-1 rounded-full border-[1.5px] border-primary bg-mint py-1 pr-1 pl-4 font-medium text-mint-foreground">
                {o.nama}
                <button type="button" aria-label={`Lepas ${o.nama}`} onClick={() => toggle(o.id)} className="flex size-9 items-center justify-center rounded-full hover:bg-card">
                  <X aria-hidden className="size-5" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      {opsi.some((o) => !o.target) && (
        <Button type="button" variant="outline" className="w-full lg:w-fit" onClick={() => setBuka(true)}>
          <Plus aria-hidden />
          {target.length ? "Materi di luar target" : "Pilih dari daftar materi"}
        </Button>
      )}

      <Dialog
        open={buka}
        onOpenChange={(v) => {
          setBuka(v);
          if (!v) setCari("");
        }}
      >
        <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Pilih materi</DialogTitle>
            <DialogDescription>Centang materi yang disampaikan pada kegiatan ini.</DialogDescription>
          </DialogHeader>
          <label className="flex h-12 items-center gap-2 rounded-xl border-[1.5px] border-input bg-card px-3">
            <Search aria-hidden className="size-5 text-muted-foreground" />
            <span className="sr-only">Cari materi</span>
            <input
              type="search"
              value={cari}
              onChange={(e) => setCari(e.target.value)}
              placeholder="Cari nama materi…"
              className="h-full min-w-0 flex-1 bg-transparent text-lg outline-none"
            />
          </label>
          <div className="-mx-1 flex max-h-[50dvh] flex-col gap-3 overflow-y-auto px-1">
            {URUTAN_ASPEK.map((a) => {
              const isi = hasil.filter((o) => o.aspek === a);
              if (!isi.length) return null;
              return (
                <div key={a} className="flex flex-col gap-1.5">
                  <p className="font-semibold text-muted-foreground">{LABEL_ASPEK[a]}</p>
                  {isi.map((o) => (
                    <KartuItem key={o.id} o={o} aktif={set.has(o.id)} onToggle={() => toggle(o.id)} />
                  ))}
                </div>
              );
            })}
            {hasil.length === 0 && <p className="px-1 text-muted-foreground">Tidak ditemukan.</p>}
          </div>
          <Button type="button" size="lg" onClick={() => setBuka(false)}>
            Selesai
          </Button>
        </DialogContent>
      </Dialog>
    </section>
  );
}

export function KartuItem({ o, aktif, onToggle }: { o: OpsiMateriItem; aktif: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={aktif}
      onClick={onToggle}
      className={cn(
        "flex min-h-14 w-full items-center gap-3 rounded-xl border-[1.5px] px-3 py-2 text-left",
        aktif ? "border-2 border-primary bg-mint text-mint-foreground" : "border-input bg-card hover:bg-mint/50",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded-md border-2",
          aktif ? "border-primary bg-primary text-primary-foreground" : "border-input",
        )}
      >
        {aktif && <Check className="size-4" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-semibold">{o.nama}</span>
        <span className="block text-muted-foreground">
          {LABEL_ASPEK[o.aspek]} · {o.mapel}
        </span>
      </span>
      {o.jenis_kelamin && <StatusChip nada="ungu">{o.jenis_kelamin === "laki_laki" ? "Putra" : "Putri"}</StatusChip>}
    </button>
  );
}
