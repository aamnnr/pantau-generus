"use client";

import { Plus, Search, X } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";
import { AksiBawah, Field, FormError, PilihanKartu, Segmen, SubmitButton } from "@/components/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { pilihNilai, type FormState } from "@/lib/form";
import { formatNoHp, inisial, LABEL_JENJANG, URUTAN_JENJANG } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { KelasRow } from "@/features/kelas/queries";

type Wali = { id: string; nama: string; no_hp: string };
type Awal = {
  nama: string;
  jenis_kelamin: string;
  tanggal_lahir: string;
  kelas_id: string;
  status: string;
  wali: string[];
  hubungan: string[];
};

export function GenerusForm({ action, awal, kelas, akunWali, ubah, hapus }: {
  action: (prev: FormState, data: FormData) => Promise<FormState>;
  awal: Awal;
  kelas: KelasRow[];
  akunWali: Wali[];
  ubah: boolean;
  hapus?: React.ReactNode;
}) {
  const [state, formAction] = useActionState(action, {});
  const v = pilihNilai(state, awal);
  const e = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <Field label="Nama lengkap" htmlFor="nama" error={e.nama}>
        <Input id="nama" name="nama" defaultValue={v.str("nama")} autoComplete="off" />
      </Field>

      <Segmen
        name="jenis_kelamin"
        legend="Jenis kelamin"
        defaultValue={v.str("jenis_kelamin")}
        error={e.jenis_kelamin}
        options={[
          { value: "laki_laki", label: "Laki-laki" },
          { value: "perempuan", label: "Perempuan" },
        ]}
      />

      <Field
        label={
          <>
            Tanggal lahir <span className="font-normal text-muted-foreground">(boleh dikosongkan)</span>
          </>
        }
        htmlFor="tanggal_lahir"
        error={e.tanggal_lahir}
      >
        <Input id="tanggal_lahir" name="tanggal_lahir" type="date" defaultValue={v.str("tanggal_lahir")} className="max-w-60" />
      </Field>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-base font-semibold">Kelas</legend>
        {kelas.length === 0 && (
          <p className="text-muted-foreground">
            Belum ada kelas. <Link href="/kelola/kelas/baru" className="font-semibold text-primary underline">Tambah kelas dulu</Link>.
          </p>
        )}
        {URUTAN_JENJANG.map((j) => {
          const isi = kelas.filter((k) => k.jenjang === j && (k.aktif || k.id === v.str("kelas_id")));
          if (isi.length === 0) return null;
          return (
            <div key={j} className="flex flex-col gap-2">
              <p className="text-muted-foreground">{LABEL_JENJANG[j]}</p>
              <PilihanKartu
                name="kelas_id"
                defaultValue={[v.str("kelas_id")]}
                options={isi.map((k) => ({ value: k.id, label: k.nama }))}
                kolom={j === "caberawit" ? 4 : 2}
              />
            </div>
          );
        })}
        {e.kelas_id?.map((m) => (
          <p key={m} className="font-medium text-destructive">
            {m}
          </p>
        ))}
      </fieldset>

      {ubah && (
        <Segmen
          name="status"
          legend="Status"
          defaultValue={v.str("status")}
          options={[
            { value: "aktif", label: "Aktif" },
            { value: "lulus", label: "Lulus" },
            { value: "pindah", label: "Pindah" },
            { value: "nonaktif", label: "Nonaktif" },
          ]}
        />
      )}

      <PilihWali akunWali={akunWali} awal={v.arr("wali")} hubunganAwal={v.arr("hubungan")} />

      <FormError error={state.error} />
      <AksiBawah>
        {hapus}
        <SubmitButton>Simpan Generus</SubmitButton>
      </AksiBawah>
    </form>
  );
}

const HUBUNGAN = ["Ayah", "Ibu", "Wali"];

function PilihWali({ akunWali, awal, hubunganAwal }: { akunWali: Wali[]; awal: string[]; hubunganAwal: string[] }) {
  const [dipilih, setDipilih] = useState(() => awal.map((id, i) => ({ id, hubungan: hubunganAwal[i] || "Wali" })));
  const [cari, setCari] = useState<string | null>(null);

  const byId = new Map(akunWali.map((w) => [w.id, w]));
  const kandidat = akunWali.filter(
    (w) => !dipilih.some((d) => d.id === w.id) && (!cari || w.nama.toLowerCase().includes(cari.toLowerCase())),
  );

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-1 text-base font-semibold">
        Wali <span className="font-normal text-muted-foreground">(akun orang tua untuk melihat progres)</span>
      </legend>

      {dipilih.map((d, i) => {
        const w = byId.get(d.id);
        return (
          <div key={d.id} className="flex flex-col gap-3 rounded-2xl border-[1.5px] border-input bg-card p-3">
            <input type="hidden" name="wali" value={d.id} />
            <input type="hidden" name="hubungan" value={d.hubungan} />
            <div className="flex items-center gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#fff1de] font-bold text-[#8a4b00]">
                {inisial(w?.nama ?? "?")}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-lg font-medium">{w?.nama ?? "Akun tidak ditemukan"}</span>
                {w && <span className="block text-muted-foreground">{formatNoHp(w.no_hp)}</span>}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Lepas ${w?.nama ?? "wali"}`}
                onClick={() => setDipilih((s) => s.filter((x) => x.id !== d.id))}
              >
                <X aria-hidden className="size-6" />
              </Button>
            </div>
            <div role="group" aria-label="Hubungan" className="grid grid-cols-3 gap-1 rounded-xl bg-secondary p-1">
              {HUBUNGAN.map((h) => (
                <button
                  key={h}
                  type="button"
                  aria-pressed={d.hubungan === h}
                  onClick={() => setDipilih((s) => s.map((x, j) => (j === i ? { ...x, hubungan: h } : x)))}
                  className={cn(
                    "h-12 rounded-lg text-base font-medium text-[#444444]",
                    d.hubungan === h && "bg-card font-semibold text-primary shadow-sm",
                  )}
                >
                  {h}
                </button>
              ))}
            </div>
          </div>
        );
      })}

      {akunWali.length === 0 ? (
        <p className="text-muted-foreground">
          Belum ada akun wali. Buat dulu di{" "}
          <Link href="/kelola/akun/baru" className="font-semibold text-primary underline">
            Kelola → Akun &amp; Wali
          </Link>
          .
        </p>
      ) : cari === null ? (
        <Button type="button" variant="outline" className="w-full lg:w-fit" onClick={() => setCari("")}>
          <Plus aria-hidden />
          Tambah wali
        </Button>
      ) : (
        <div className="flex flex-col gap-2 rounded-2xl bg-secondary p-3">
          <label className="flex h-12 items-center gap-2 rounded-xl border-[1.5px] border-input bg-card px-3">
            <Search aria-hidden className="size-5 text-muted-foreground" />
            <span className="sr-only">Cari wali</span>
            <input
              autoFocus
              type="search"
              value={cari}
              onChange={(e) => setCari(e.target.value)}
              placeholder="Cari nama wali…"
              className="h-full min-w-0 flex-1 bg-transparent text-lg outline-none"
            />
          </label>
          <ul className="flex max-h-72 flex-col gap-1.5 overflow-y-auto">
            {kandidat.map((w) => (
              <li key={w.id}>
                <button
                  type="button"
                  onClick={() => {
                    setDipilih((s) => [...s, { id: w.id, hubungan: "Wali" }]);
                    setCari(null);
                  }}
                  className="flex min-h-14 w-full items-center justify-between gap-2 rounded-xl bg-card px-3 text-left hover:bg-mint"
                >
                  <span className="text-lg font-medium">{w.nama}</span>
                  <span className="text-muted-foreground">{formatNoHp(w.no_hp)}</span>
                </button>
              </li>
            ))}
            {kandidat.length === 0 && <li className="px-1 py-2 text-muted-foreground">Tidak ditemukan.</li>}
          </ul>
          <Button type="button" variant="ghost" onClick={() => setCari(null)}>
            Tutup
          </Button>
        </div>
      )}
    </fieldset>
  );
}
