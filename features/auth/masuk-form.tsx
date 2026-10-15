"use client";

import { Eye, EyeOff, Loader2 } from "lucide-react";
import { FormError } from "@/components/form";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { masuk, type MasukState } from "./actions";

export function MasukForm() {
  const [state, formAction, pending] = useActionState<MasukState, FormData>(masuk, {});
  const [lihatPin, setLihatPin] = useState(false);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="noHp">No. HP</Label>
        <Input
          id="noHp"
          name="noHp"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="0812 3456 7890"
          defaultValue={state.noHp}
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="pin">PIN</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setLihatPin((v) => !v)}
            aria-pressed={lihatPin}
            aria-controls="pin"
            className="-mr-2 text-primary"
          >
            {lihatPin ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
            {lihatPin ? "Sembunyikan" : "Tampilkan"}
          </Button>
        </div>
        <InputOTP
          id="pin"
          name="pin"
          maxLength={6}
          inputMode="numeric"
          pattern="^[0-9]*$"
          autoComplete="current-password"
          containerClassName="justify-start"
        >
          <InputOTPGroup>
            {Array.from({ length: 6 }, (_, i) => (
              <InputOTPSlot key={i} index={i} samar={!lihatPin} />
            ))}
          </InputOTPGroup>
        </InputOTP>
      </div>

      <FormError error={state.error} />

      <Button type="submit" size="lg" className="w-full" disabled={pending} aria-busy={pending}>
        {pending ? (
          <>
            <Loader2 aria-hidden className="animate-spin" />
            Memeriksa…
          </>
        ) : (
          "Masuk"
        )}
      </Button>

      <p className="text-center text-sm text-muted-foreground">Lupa PIN? Hubungi admin kelompok.</p>
    </form>
  );
}
