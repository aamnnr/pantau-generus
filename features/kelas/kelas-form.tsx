"use client";

import { useActionState } from "react";
import { AksiBawah, Field, FormError, Segmen, SubmitButton } from "@/components/form";
import { Input } from "@/components/ui/input";
import { pilihNilai, type FormState } from "@/lib/form";
import { LABEL_JENJANG, URUTAN_JENJANG, type Jenjang } from "@/lib/format";

type Awal = { jenjang: Jenjang | ""; nama: string; urutan: number; aktif: "ya" | "tidak" };

export function KelasForm({ action, awal, hapus }: {
  action: (prev: FormState, data: FormData) => Promise<FormState>;
  awal: Awal;
  hapus?: React.ReactNode;
}) {
  const [state, formAction] = useActionState(action, {});
  const v = pilihNilai(state, awal);
  const e = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <Segmen
        name="jenjang"
        legend="Jenjang"
        defaultValue={v.str("jenjang")}
        error={e.jenjang}
        options={URUTAN_JENJANG.map((j) => ({ value: j, label: LABEL_JENJANG[j] }))}
      />
      <Field label="Nama kelas" htmlFor="nama" error={e.nama} hint="Contoh: TK, 1A, 2B, Usia sekolah (SLTA), Usia mandiri">
        <Input id="nama" name="nama" defaultValue={v.str("nama")} autoComplete="off" />
      </Field>
      <Field label="Urutan tampil" htmlFor="urutan" error={e.urutan} hint="Angka kecil tampil lebih dulu dalam jenjangnya.">
        <Input id="urutan" name="urutan" type="number" inputMode="numeric" min={0} defaultValue={v.str("urutan")} className="max-w-40" />
      </Field>
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
        <SubmitButton>Simpan Kelas</SubmitButton>
      </AksiBawah>
    </form>
  );
}
