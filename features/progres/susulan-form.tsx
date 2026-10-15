"use client";

import { useActionState, useState } from "react";
import { AksiBawah, Field, FormError, SubmitButton } from "@/components/form";
import { barisBaru, barisDariAwal, barisKeJson, BarisRentang, type Baris, type Kitab, type RentangAwal, type Surat } from "@/components/rentang-kitab";
import { Input } from "@/components/ui/input";
import type { FormState } from "@/lib/form";

/** Catat susulan (PRD F6 aturan 6): satu rentang materi yang sudah dikejar anak + tanggalnya. */
export function SusulanForm({ kitab, surat, awal, tanggal, action }: {
  kitab: Kitab[];
  surat: Surat[];
  awal: RentangAwal | null;
  tanggal: string;
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
}) {
  const [b, setB] = useState<Baris>(() => (awal ? barisDariAwal(awal) : barisBaru(kitab.length === 1 ? kitab[0].id : "")));
  const [state, formAction] = useActionState(action, {});
  const json = barisKeJson([b], kitab)[0] ?? null;

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="baris" value={JSON.stringify(json)} />
      <BarisRentang judul="Materi yang dikejar" b={b} kitab={kitab} surat={surat} ubah={(p) => setB((x) => ({ ...x, ...p }))} />
      <Field label="Tanggal susulan" htmlFor="tanggal">
        <Input id="tanggal" name="tanggal" type="date" defaultValue={String(state.values?.tanggal ?? tanggal)} required className="h-14 text-lg" />
      </Field>
      <FormError error={state.error} />
      <AksiBawah>
        <SubmitButton disabled={!json}>Simpan Susulan</SubmitButton>
      </AksiBawah>
    </form>
  );
}
