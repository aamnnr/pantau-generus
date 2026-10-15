"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { FormError, SubmitButton } from "@/components/form";
import { Textarea } from "@/components/ui/textarea";
import type { SimpanState } from "./actions";

export function CatatanForm({ bulan, awal, action }: {
  bulan: string;
  awal: string;
  action: (prev: SimpanState, fd: FormData) => Promise<SimpanState>;
}) {
  const [state, formAction] = useActionState(action, {});
  useEffect(() => {
    if (state.ok) toast.success(state.ok);
  }, [state]);
  return (
    <form action={formAction} className="flex flex-col gap-3 print:hidden">
      <input type="hidden" name="bulan" value={bulan} />
      <label htmlFor="catatan" className="font-semibold">
        Catatan pengajar/pengurus
      </label>
      <Textarea id="catatan" name="catatan" defaultValue={awal} rows={4} className="text-lg" placeholder="Mis. sudah lancar doa harian, perlu ditingkatkan kehadirannya." />
      <FormError error={state.error} />
      <SubmitButton variant="outline" className="self-start">Simpan Catatan</SubmitButton>
    </form>
  );
}
