"use client";

import { Trash2 } from "lucide-react";
import { useActionState, useEffect, useTransition } from "react";
import { toast } from "sonner";
import { SubmitButton } from "@/components/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { FormState } from "@/lib/form";
import type { JilidState } from "./actions";

type Aksi = (prev: JilidState, fd: FormData) => Promise<JilidState>;

function useHasil(state: JilidState) {
  useEffect(() => {
    if (state.ok) toast.success(state.ok);
    if (state.error && !state.fieldErrors) toast.error(state.error);
  }, [state]);
}

/** Satu baris jilid: jumlah halaman bisa diubah langsung. */
export function BarisJilid({ jilid, totalHalaman, action, hapus, bisaUbah }: {
  jilid: number;
  totalHalaman: number;
  action: Aksi;
  hapus: () => Promise<FormState>;
  bisaUbah: boolean;
}) {
  const [state, formAction] = useActionState(action, {});
  const [pending, start] = useTransition();
  useHasil(state);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3 rounded-2xl bg-card p-3 shadow-[0_1px_2px_rgba(18,20,19,0.06)]">
      <input type="hidden" name="jilid" value={jilid} />
      <span className="flex size-14 shrink-0 flex-col items-center justify-center rounded-xl bg-mint leading-none text-mint-foreground">
        <span className="text-base">Jilid</span>
        <span className="text-xl font-bold">{jilid}</span>
      </span>
      <label className="flex min-w-36 flex-1 flex-col gap-1">
        <span className="text-base font-semibold">Jumlah halaman</span>
        <Input name="total_halaman" type="number" inputMode="numeric" min={1} defaultValue={totalHalaman} disabled={!bisaUbah} />
      </label>
      {bisaUbah && (
        <div className="flex gap-2">
          <SubmitButton variant="outline" size="default" className="w-auto lg:min-w-0">
            Simpan
          </SubmitButton>
          <Button
            type="button"
            variant="destructive"
            size="icon"
            aria-label={`Hapus jilid ${jilid}`}
            disabled={pending}
            onClick={() =>
              start(async () => {
                if (!confirm(`Hapus jilid ${jilid}?`)) return;
                const r = await hapus();
                if (r.error) toast.error(r.error);
              })
            }
          >
            <Trash2 aria-hidden />
          </Button>
        </div>
      )}
      {state.fieldErrors?.total_halaman?.map((m) => (
        <p key={m} className="w-full font-medium text-destructive">
          {m}
        </p>
      ))}
    </form>
  );
}

export function TambahJilid({ action, jilidBerikut }: { action: Aksi; jilidBerikut: number }) {
  const [state, formAction] = useActionState(action, {});
  useHasil(state);
  const e = state.fieldErrors ?? {};

  return (
    // key: kosongkan isian setelah berhasil menambah
    <form key={jilidBerikut} action={formAction} className="flex flex-wrap items-end gap-3 rounded-2xl border-2 border-dashed border-input p-3">
      <label className="flex w-28 flex-col gap-1">
        <span className="text-base font-semibold">Jilid</span>
        <Input name="jilid" type="number" inputMode="numeric" min={1} defaultValue={jilidBerikut} />
      </label>
      <label className="flex min-w-36 flex-1 flex-col gap-1">
        <span className="text-base font-semibold">Jumlah halaman</span>
        <Input name="total_halaman" type="number" inputMode="numeric" min={1} />
      </label>
      <SubmitButton size="default" className="w-auto lg:min-w-0">
        Tambah Jilid
      </SubmitButton>
      {[...(e.jilid ?? []), ...(e.total_halaman ?? [])].map((m) => (
        <p key={m} className="w-full font-medium text-destructive">
          {m}
        </p>
      ))}
    </form>
  );
}
