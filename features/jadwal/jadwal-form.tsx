"use client";

import { useActionState } from "react";
import { AksiBawah, Field, FormError, PilihanKartu, Segmen, SubmitButton } from "@/components/form";
import { Input } from "@/components/ui/input";
import { pilihNilai, type FormState } from "@/lib/form";
import { LABEL_HARI, LABEL_JENJANG, URUTAN_JENJANG } from "@/lib/format";
import type { KelasRow } from "@/features/kelas/queries";

type Awal = { hari: string; jam_mulai: string; jam_selesai: string; kelas: string[]; guru_id: string; aktif: "ya" | "tidak" };

export function JadwalForm({ action, awal, kelas, guru, hapus }: {
  action: (prev: FormState, data: FormData) => Promise<FormState>;
  awal: Awal;
  kelas: KelasRow[];
  guru: { id: string; nama: string }[];
  hapus?: React.ReactNode;
}) {
  const [state, formAction] = useActionState(action, {});
  const v = pilihNilai(state, awal);
  const e = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-base font-semibold">Hari</legend>
        <PilihanKartu
          name="hari"
          defaultValue={[v.str("hari")]}
          kolom={4}
          options={[1, 2, 3, 4, 5, 6, 7].map((h) => ({ value: String(h), label: LABEL_HARI[h] }))}
        />
        {e.hari?.map((m) => (
          <p key={m} className="font-medium text-destructive">
            {m}
          </p>
        ))}
      </fieldset>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Jam mulai" htmlFor="jam_mulai" error={e.jam_mulai}>
          <Input id="jam_mulai" name="jam_mulai" type="time" defaultValue={v.str("jam_mulai").slice(0, 5)} />
        </Field>
        <Field
          label={
            <>
              Jam selesai <span className="font-normal text-muted-foreground">(opsional)</span>
            </>
          }
          htmlFor="jam_selesai"
          error={e.jam_selesai}
        >
          <Input id="jam_selesai" name="jam_selesai" type="time" defaultValue={v.str("jam_selesai").slice(0, 5)} />
        </Field>
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-base font-semibold">Kelas (pilih lebih dari satu untuk pengajian gabungan)</legend>
        {URUTAN_JENJANG.map((j) => {
          const isi = kelas.filter((k) => k.jenjang === j && (k.aktif || v.arr("kelas").includes(k.id)));
          if (isi.length === 0) return null;
          return (
            <div key={j} className="flex flex-col gap-2">
              <p className="text-muted-foreground">{LABEL_JENJANG[j]}</p>
              <PilihanKartu
                name="kelas"
                type="checkbox"
                defaultValue={v.arr("kelas")}
                options={isi.map((k) => ({ value: k.id, label: k.nama }))}
                kolom={j === "caberawit" ? 4 : 2}
              />
            </div>
          );
        })}
        {e.kelas?.map((m) => (
          <p key={m} className="font-medium text-destructive">
            {m}
          </p>
        ))}
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-base font-semibold">Guru default</legend>
        <PilihanKartu
          name="guru_id"
          defaultValue={[v.str("guru_id")]}
          kolom={2}
          options={[{ value: "", label: "Belum ditentukan" }, ...guru.map((g) => ({ value: g.id, label: g.nama }))]}
        />
        <p className="text-muted-foreground">Otomatis menjadi pengajar kegiatan; bisa diganti per kegiatan.</p>
      </fieldset>

      <Segmen
        name="aktif"
        legend="Status"
        defaultValue={v.str("aktif")}
        options={[
          { value: "ya", label: "Aktif" },
          { value: "tidak", label: "Nonaktif" },
        ]}
      />
      <FormError error={state.error} />
      <AksiBawah>
        {hapus}
        <SubmitButton>Simpan Jadwal</SubmitButton>
      </AksiBawah>
    </form>
  );
}
