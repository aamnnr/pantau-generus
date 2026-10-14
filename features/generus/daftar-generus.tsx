"use client";

import { ArrowUp, ChevronRight, Search, X } from "lucide-react";
import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { FormError, PilihanKartu, SubmitButton } from "@/components/form";
import { Kosong } from "@/components/page";
import { CHIP_STATUS_GENERUS, StatusChip } from "@/components/status-chip";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { FormState } from "@/lib/form";
import { inisial, LABEL_JENJANG, LABEL_STATUS_GENERUS, labelKelas, URUTAN_JENJANG, type Jenjang } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { KelasRow } from "@/features/kelas/queries";
import type { GenerusRow } from "./queries";

type Filter = "semua" | Jenjang;

export function DaftarGenerus({ data, kelas, bisaUbah, naikKelas }: {
  data: GenerusRow[];
  kelas: KelasRow[];
  bisaUbah: boolean;
  naikKelas: (prev: FormState, fd: FormData) => Promise<FormState>;
}) {
  const [q, setQ] = useState("");
  const [jenjang, setJenjang] = useState<Filter>("semua");
  const [tampilSemua, setTampilSemua] = useState(false);
  const [pilihMode, setPilihMode] = useState(false);
  const [dipilih, setDipilih] = useState<Set<string>>(new Set());
  const [dialog, setDialog] = useState(false);

  const tampil = useMemo(() => {
    const kata = q.trim().toLowerCase();
    return data.filter(
      (g) =>
        (tampilSemua || g.status === "aktif") &&
        (jenjang === "semua" || g.kelas?.jenjang === jenjang) &&
        (!kata || g.nama.toLowerCase().includes(kata)),
    );
  }, [data, q, jenjang, tampilSemua]);

  const jumlahTidakAktif = data.filter((g) => g.status !== "aktif").length;
  const jenjangAda = URUTAN_JENJANG.filter((j) => data.some((g) => g.kelas?.jenjang === j));

  function toggle(id: string) {
    setDipilih((s) => {
      const baru = new Set(s);
      if (baru.has(id)) baru.delete(id);
      else baru.add(id);
      return baru;
    });
  }

  function keluarPilih() {
    setPilihMode(false);
    setDipilih(new Set());
  }

  const semuaTerpilih = tampil.length > 0 && tampil.every((g) => dipilih.has(g.id));

  return (
    <div className="flex flex-col gap-4 px-4 lg:px-0">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <label className="flex h-14 flex-1 items-center gap-2.5 rounded-2xl border-[1.5px] border-input bg-card px-4 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
          <Search aria-hidden className="size-5 shrink-0 text-muted-foreground" />
          <span className="sr-only">Cari nama</span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari nama anak…"
            className="h-full min-w-0 flex-1 bg-transparent text-lg outline-none placeholder:text-muted-foreground"
          />
        </label>
        {jenjangAda.length > 1 && (
          <div role="group" aria-label="Saring jenjang" className="flex gap-1 overflow-x-auto rounded-2xl bg-secondary p-1">
            {(["semua", ...jenjangAda] as Filter[]).map((j) => (
              <button
                key={j}
                type="button"
                aria-pressed={jenjang === j}
                onClick={() => setJenjang(j)}
                className={cn(
                  "h-12 shrink-0 rounded-xl px-4 text-base font-medium text-[#444444]",
                  jenjang === j && "bg-card font-semibold text-primary shadow-sm",
                )}
              >
                {j === "semua" ? "Semua" : LABEL_JENJANG[j]}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-muted-foreground">
          {tampil.length} anak{!tampilSemua && " aktif"}
          {jumlahTidakAktif > 0 && (
            <>
              {" · "}
              <button type="button" className="font-semibold text-primary underline underline-offset-4" onClick={() => setTampilSemua((v) => !v)}>
                {tampilSemua ? "Sembunyikan yang tidak aktif" : `Tampilkan ${jumlahTidakAktif} yang tidak aktif`}
              </button>
            </>
          )}
        </p>
        {bisaUbah && !pilihMode && data.length > 0 && (
          <Button type="button" variant="secondary" className="bg-kunyit text-kunyit-foreground hover:bg-kunyit/85" onClick={() => setPilihMode(true)}>
            <ArrowUp aria-hidden />
            Naik kelas
          </Button>
        )}
      </div>

      {pilihMode && (
        <div className="sticky top-2 z-20 flex flex-wrap items-center gap-2 rounded-2xl border-[1.5px] border-[#ffd199] bg-[#fff1de] p-3">
          <p className="flex-1 text-lg font-semibold">{dipilih.size} anak dipilih</p>
          <Button
            type="button"
            variant="outline"
            onClick={() => setDipilih(semuaTerpilih ? new Set() : new Set(tampil.map((g) => g.id)))}
          >
            {semuaTerpilih ? "Kosongkan" : "Pilih semua"}
          </Button>
          <Button type="button" variant="outline" onClick={keluarPilih}>
            <X aria-hidden />
            Batal
          </Button>
          <Button
            type="button"
            className="bg-kunyit text-kunyit-foreground hover:bg-kunyit/85"
            disabled={dipilih.size === 0}
            onClick={() => setDialog(true)}
          >
            Naik ke kelas…
          </Button>
        </div>
      )}

      {tampil.length === 0 ? (
        <Kosong
          judul={data.length === 0 ? "Belum ada data generus" : "Tidak ada yang cocok"}
          keterangan={data.length === 0 ? "Tambahkan anak binaan beserta kelasnya." : "Coba kata pencarian atau saringan lain."}
        />
      ) : (
        <>
          {/* HP & tablet: kartu */}
          <ul className="grid grid-cols-1 gap-2.5 md:grid-cols-2 lg:hidden">
            {tampil.map((g) => (
              <li key={g.id}>
                <KartuGenerus g={g} pilihMode={pilihMode} dipilih={dipilih.has(g.id)} onToggle={() => toggle(g.id)} bisaUbah={bisaUbah} />
              </li>
            ))}
          </ul>

          {/* Desktop: tabel */}
          <div className="hidden overflow-x-auto rounded-2xl bg-card shadow-[0_1px_2px_rgba(18,20,19,0.06)] lg:block">
            <table className="w-full min-w-[720px] border-collapse text-left text-lg">
              <thead>
                <tr className="bg-mint text-base text-mint-foreground">
                  {pilihMode && (
                    <th scope="col" className="w-14 px-4 py-3.5">
                      <input
                        type="checkbox"
                        aria-label="Pilih semua"
                        checked={semuaTerpilih}
                        onChange={() => setDipilih(semuaTerpilih ? new Set() : new Set(tampil.map((g) => g.id)))}
                        className="size-6 accent-primary"
                      />
                    </th>
                  )}
                  <th scope="col" className="px-4 py-3.5 font-semibold">Nama</th>
                  <th scope="col" className="px-2 py-3.5 font-semibold">Kelas</th>
                  <th scope="col" className="px-2 py-3.5 font-semibold">Wali</th>
                  <th scope="col" className="px-2 py-3.5 font-semibold">Status</th>
                  {bisaUbah && <th scope="col" className="px-4 py-3.5 text-right font-semibold">Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {tampil.map((g) => {
                  const chip = CHIP_STATUS_GENERUS[g.status];
                  return (
                    <tr key={g.id} className={cn("border-t border-border", dipilih.has(g.id) && "bg-[#fffaf2]")}>
                      {pilihMode && (
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            aria-label={`Pilih ${g.nama}`}
                            checked={dipilih.has(g.id)}
                            onChange={() => toggle(g.id)}
                            className="size-6 accent-primary"
                          />
                        </td>
                      )}
                      <td className="px-4 py-3 font-medium">{g.nama}</td>
                      <td className="px-2 py-3 text-[#444444]">{g.kelas ? labelKelas(g.kelas) : "—"}</td>
                      <td className="px-2 py-3 text-[#444444]">{g.wali.join(", ") || "—"}</td>
                      <td className="px-2 py-3">
                        <StatusChip nada={chip.nada} simbol={chip.simbol}>
                          {LABEL_STATUS_GENERUS[g.status]}
                        </StatusChip>
                      </td>
                      {bisaUbah && (
                        <td className="px-4 py-2 text-right">
                          <Button asChild variant="ghost" className="text-primary">
                            <Link href={`/generus/${g.id}/ubah`}>Ubah</Link>
                          </Button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      <DialogNaikKelas
        open={dialog}
        onOpenChange={setDialog}
        dipilih={[...dipilih]}
        kelas={kelas}
        action={naikKelas}
      />
    </div>
  );
}

function KartuGenerus({ g, pilihMode, dipilih, onToggle, bisaUbah }: {
  g: GenerusRow;
  pilihMode: boolean;
  dipilih: boolean;
  onToggle: () => void;
  bisaUbah: boolean;
}) {
  const chip = CHIP_STATUS_GENERUS[g.status];
  const isi = (
    <>
      <span
        className={cn(
          "flex size-12 shrink-0 items-center justify-center rounded-xl text-lg font-bold",
          pilihMode && dipilih ? "bg-primary text-primary-foreground" : "bg-mint text-mint-foreground",
        )}
      >
        {pilihMode && dipilih ? "✓" : inisial(g.nama)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-lg font-medium">{g.nama}</span>
        <span className="block text-muted-foreground">{g.kelas ? labelKelas(g.kelas) : "Tanpa kelas"}</span>
      </span>
      {g.status !== "aktif" && (
        <StatusChip nada={chip.nada} simbol={chip.simbol}>
          {LABEL_STATUS_GENERUS[g.status]}
        </StatusChip>
      )}
      {!pilihMode && bisaUbah && <ChevronRight aria-hidden className="size-6 shrink-0 text-muted-foreground" />}
    </>
  );
  const kelasKartu = cn(
    "flex min-h-19 w-full items-center gap-3.5 rounded-2xl bg-card px-3.5 py-3 text-left shadow-[0_1px_2px_rgba(18,20,19,0.06)]",
    dipilih && "ring-2 ring-primary",
  );

  if (pilihMode) {
    return (
      <label className={cn(kelasKartu, "cursor-pointer")}>
        <input type="checkbox" checked={dipilih} onChange={onToggle} className="sr-only" aria-label={`Pilih ${g.nama}`} />
        {isi}
      </label>
    );
  }
  if (bisaUbah) {
    return (
      <Link href={`/generus/${g.id}/ubah`} className={cn(kelasKartu, "hover:bg-mint/60")}>
        {isi}
      </Link>
    );
  }
  return <div className={kelasKartu}>{isi}</div>;
}

function DialogNaikKelas({ open, onOpenChange, dipilih, kelas, action }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  dipilih: string[];
  kelas: KelasRow[];
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
}) {
  const [state, formAction] = useActionState(action, {});
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Naik ke kelas mana?</DialogTitle>
          <DialogDescription>{dipilih.length} anak akan dipindahkan. Riwayat kelas lama tetap tersimpan.</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          {dipilih.map((id) => (
            <input key={id} type="hidden" name="generus" value={id} />
          ))}
          {URUTAN_JENJANG.map((j) => {
            const isi = kelas.filter((k) => k.jenjang === j && k.aktif);
            if (isi.length === 0) return null;
            return (
              <fieldset key={j} className="flex flex-col gap-2">
                <legend className="mb-2 font-semibold text-muted-foreground">{LABEL_JENJANG[j]}</legend>
                <PilihanKartu name="kelas_id" options={isi.map((k) => ({ value: k.id, label: k.nama }))} kolom={j === "caberawit" ? 4 : 2} />
              </fieldset>
            );
          })}
          <FormError error={state.error} />
          <SubmitButton pendingLabel="Memindahkan…" className="bg-kunyit text-kunyit-foreground hover:bg-kunyit/85">
            Pindahkan {dipilih.length} anak
          </SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}
