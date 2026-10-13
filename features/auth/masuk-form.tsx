"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { masuk, type MasukState } from "./actions";

export function MasukForm() {
  const [state, formAction, pending] = useActionState<MasukState, FormData>(masuk, {});

  return (
    <form action={formAction} className="flex flex-col gap-6">
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
        <Label htmlFor="pin">PIN</Label>
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
              <InputOTPSlot key={i} index={i} />
            ))}
          </InputOTPGroup>
        </InputOTP>
      </div>

      {state.error && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-4 py-3 text-destructive">
          {state.error}
        </p>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Memeriksa…" : "Masuk"}
      </Button>

      <p className="text-center text-muted-foreground">Lupa PIN? Hubungi admin kelompok.</p>
    </form>
  );
}
