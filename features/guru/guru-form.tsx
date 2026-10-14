"use client";

import { useActionState } from "react";
import { AksiBawah, Field, FormError, PilihanKartu, Segmen, SubmitButton } from "@/components/form";
import { Input } from "@/components/ui/input";
import { pilihNilai, type FormState } from "@/lib/form";
import { LABEL_JENJANG, URUTAN_JENJANG } from "@/lib/format";
import type { KelasRow } from "@/features/kelas/queries";

type Awal = { nama: string; no_hp: string; kelas: string[]; aktif: "ya" | "tidak" };

export function GuruForm({ action, awal, kelas, punyaAkun, hapus }: {
  action: (prev: FormState, data: FormData) => Promise<FormState>;
  awal: Awal;
  kelas: KelasRow[];
  punyaAkun: boolean;
  hapus?: React.ReactNode;
}) {
  const [state, formAction] = useActionState(action, {});
  const v = pilihNilai(state, awal);
  const e = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <Field label="Nama guru" htmlFor="nama" error={e.nama}>
        <Input id="nama" name="nama" defaultValue={v.str("nama")} autoComplete="off" />
      </Field>
      <Field
        label={
          <>
            No. HP <span className="font-normal text-muted-foreground">(boleh dikosongkan)</span>
          </>
        }
        htmlFor="no_hp"
        error={e.no_hp}
        hint={
          punyaAkun
            ? "Guru ini sudah punya akun untuk masuk."
            : "Guru tanpa akun tetap tercatat; admin mengisi kegiatan atas namanya. Akun bisa dibuat di Akun & Wali."
        }
      >
        <Input id="no_hp" name="no_hp" type="tel" inputMode="tel" defaultValue={v.str("no_hp")} autoComplete="off" />
      </Field>
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-base font-semibold">Kelas yang diajar</legend>
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
        {kelas.length === 0 && <p className="text-muted-foreground">Belum ada kelas.</p>}
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
        <SubmitButton>Simpan Guru</SubmitButton>
      </AksiBawah>
    </form>
  );
}
