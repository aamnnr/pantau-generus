"use client";

import { Dices } from "lucide-react";
import { useActionState, useState } from "react";
import { AksiBawah, Field, FormError, PilihanKartu, SubmitButton } from "@/components/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { pilihNilai, type FormState } from "@/lib/form";

const OPSI_PERAN = [
  { value: "admin", label: "Admin", sub: "Kelola semua data" },
  { value: "guru", label: "Guru", sub: "Kelas yang diajar" },
  { value: "pengurus", label: "Pengurus", sub: "Lihat & raport" },
  { value: "wali", label: "Wali", sub: "Lihat anaknya" },
];

/** PIN acak 6 angka agar admin tidak memakai PIN yang mudah ditebak. */
function pinAcak() {
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return String(a[0] % 1_000_000).padStart(6, "0");
}

export function PinInput({ name = "pin", error, label = "PIN awal (6 angka)" }: { name?: string; error?: string[]; label?: string }) {
  const [pin, setPin] = useState("");
  return (
    <Field label={label} htmlFor={name} error={error} hint="Catat dan sampaikan PIN ini kepada pemilik akun.">
      <div className="flex gap-2">
        <Input
          id={name}
          name={name}
          inputMode="numeric"
          autoComplete="off"
          maxLength={6}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
          className="max-w-44 text-center text-xl font-semibold tracking-[0.3em] tabular-nums"
        />
        <Button type="button" variant="outline" onClick={() => setPin(pinAcak())}>
          <Dices aria-hidden />
          Buat acak
        </Button>
      </div>
    </Field>
  );
}

type Awal = { nama: string; no_hp: string; peran: string[] };

export function AkunForm({ action, awal, baru, hapus }: {
  action: (prev: FormState, data: FormData) => Promise<FormState>;
  awal: Awal;
  baru: boolean;
  hapus?: React.ReactNode;
}) {
  const [state, formAction] = useActionState(action, {});
  const v = pilihNilai(state, awal);
  const e = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <Field label="Nama" htmlFor="nama" error={e.nama}>
        <Input id="nama" name="nama" defaultValue={v.str("nama")} autoComplete="off" />
      </Field>
      <Field label="No. HP" htmlFor="no_hp" error={e.no_hp} hint="Dipakai untuk masuk. Format bebas, mis. 0812 3456 7890.">
        <Input id="no_hp" name="no_hp" type="tel" inputMode="tel" defaultValue={v.str("no_hp")} autoComplete="off" />
      </Field>
      {baru && <PinInput error={e.pin} />}
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-base font-semibold">Peran (boleh lebih dari satu)</legend>
        <PilihanKartu name="peran" type="checkbox" options={OPSI_PERAN} defaultValue={v.arr("peran")} kolom={2} />
        {e.peran?.map((m) => (
          <p key={m} className="font-medium text-destructive">
            {m}
          </p>
        ))}
      </fieldset>
      <FormError error={state.error} />
      <AksiBawah>
        {hapus}
        <SubmitButton>{baru ? "Buat Akun" : "Simpan Akun"}</SubmitButton>
      </AksiBawah>
    </form>
  );
}

export function ResetPinForm({ action }: { action: (prev: FormState, data: FormData) => Promise<FormState> }) {
  const [state, formAction] = useActionState(action, {});
  return (
    <form action={formAction} className="flex flex-col gap-4">
      <PinInput label="PIN baru (6 angka)" error={state.fieldErrors?.pin} />
      <FormError error={state.error} />
      <SubmitButton variant="outline" pendingLabel="Mengganti…">
        Ganti PIN
      </SubmitButton>
    </form>
  );
}
