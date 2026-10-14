"use client";

import { useActionState } from "react";
import { AksiBawah, Field, FormError, Segmen, SubmitButton } from "@/components/form";
import { Input } from "@/components/ui/input";
import { pilihNilai, type FormState } from "@/lib/form";

type Awal = { nama: string; total_satuan: string; urutan: string; aktif: "ya" | "tidak" };

export function KitabForm({ action, awal, hapus }: {
  action: (prev: FormState, data: FormData) => Promise<FormState>;
  awal: Awal;
  hapus?: React.ReactNode;
}) {
  const [state, formAction] = useActionState(action, {});
  const v = pilihNilai(state, awal);
  const e = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <Field label="Nama kitab" htmlFor="nama" error={e.nama} hint="Contoh: K. Janaiz, K. Sholah, Mukhtaru Ad'iyah">
        <Input id="nama" name="nama" defaultValue={v.str("nama")} autoComplete="off" />
      </Field>
      <Field label="Jumlah halaman" htmlFor="total_satuan" error={e.total_satuan} hint="Dipakai untuk menghitung persentase progres makna.">
        <Input id="total_satuan" name="total_satuan" type="number" inputMode="numeric" min={1} defaultValue={v.str("total_satuan")} className="max-w-44" />
      </Field>
      <Field label="Urutan tampil" htmlFor="urutan" error={e.urutan}>
        <Input id="urutan" name="urutan" type="number" inputMode="numeric" min={0} defaultValue={v.str("urutan")} className="max-w-44" />
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
        <SubmitButton>Simpan Kitab</SubmitButton>
      </AksiBawah>
    </form>
  );
}
