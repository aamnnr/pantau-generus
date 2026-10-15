"use client";

import { useActionState, useState } from "react";
import { AksiBawah, Field, FormError, Segmen, SubmitButton } from "@/components/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { pilihNilai, type FormState } from "@/lib/form";
import { LABEL_ASPEK, SARAN_MAPEL, URUTAN_ASPEK, type Aspek } from "@/lib/format";
import { cn } from "@/lib/utils";

type Awal = {
  aspek: string;
  mapel: string;
  nama: string;
  keterangan: string;
  jenjang: string;
  jenis_kelamin: string;
  urutan: string;
  aktif: "ya" | "tidak";
};

export function MateriForm({ action, awal, mapelTerpakai, hapus }: {
  action: (prev: FormState, data: FormData) => Promise<FormState>;
  awal: Awal;
  mapelTerpakai: { aspek: Aspek; mapel: string }[];
  hapus?: React.ReactNode;
}) {
  const [state, formAction] = useActionState(action, {});
  const v = pilihNilai(state, awal);
  const e = state.fieldErrors ?? {};
  const [aspek, setAspek] = useState(v.str("aspek"));
  const [mapel, setMapel] = useState(v.str("mapel"));

  const saran = aspek
    ? [...new Set([...SARAN_MAPEL[aspek as Aspek], ...mapelTerpakai.filter((m) => m.aspek === aspek).map((m) => m.mapel)])]
    : [];

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {/* Aspek dikendalikan agar saran mapel ikut berganti. */}
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-base font-semibold">Aspek</legend>
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-secondary p-1 sm:grid-cols-4">
          {URUTAN_ASPEK.map((a) => (
            <label key={a} className="relative cursor-pointer">
              <input type="radio" name="aspek" value={a} checked={aspek === a} onChange={() => setAspek(a)} className="peer sr-only" />
              <span className="flex min-h-10 items-center justify-center rounded-xl px-2 text-center text-base leading-tight font-medium text-muted-foreground peer-checked:bg-card peer-checked:font-semibold peer-checked:text-primary peer-checked:shadow-sm peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50">
                {LABEL_ASPEK[a]}
              </span>
            </label>
          ))}
        </div>
        {e.aspek?.map((m) => (
          <p key={m} className="font-medium text-destructive">
            {m}
          </p>
        ))}
      </fieldset>

      <Field label="Mapel" htmlFor="mapel" error={e.mapel}>
        <Input id="mapel" name="mapel" value={mapel} onChange={(ev) => setMapel(ev.target.value)} autoComplete="off" />
        {saran.length > 0 && (
          <div className="flex flex-wrap gap-2" aria-label="Saran mapel">
            {saran.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setMapel(s)}
                className={cn(
                  "min-h-11 rounded-full border px-4 text-base font-medium",
                  mapel === s ? "border-primary bg-mint text-mint-foreground" : "border-input bg-card",
                )}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </Field>

      <Field label="Nama materi" htmlFor="nama" error={e.nama} hint="Contoh: Doa sebelum makan · Memahami tentang Rukun Iman · Mengenal instalasi listrik">
        <Textarea id="nama" name="nama" defaultValue={v.str("nama")} className="min-h-20" />
      </Field>

      <Field
        label={
          <>
            Keterangan <span className="font-normal text-muted-foreground">(opsional)</span>
          </>
        }
        htmlFor="keterangan"
        error={e.keterangan}
        hint="Rincian butir, mis. “Ta'at, ta'dhim, bersyukur, tawadhu'…”"
      >
        <Textarea id="keterangan" name="keterangan" defaultValue={v.str("keterangan")} />
      </Field>

      <Segmen
        name="jenjang"
        legend="Berlaku untuk jenjang"
        defaultValue={v.str("jenjang")}
        options={[
          { value: "semua", label: "Semua" },
          { value: "caberawit", label: "Caberawit" },
          { value: "pra_remaja", label: "Pra-remaja" },
          { value: "remaja", label: "Remaja" },
        ]}
      />
      <Segmen
        name="jenis_kelamin"
        legend="Khusus"
        defaultValue={v.str("jenis_kelamin")}
        options={[
          { value: "semua", label: "Putra & putri" },
          { value: "laki_laki", label: "Putra saja" },
          { value: "perempuan", label: "Putri saja" },
        ]}
      />
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
        <SubmitButton>Simpan Materi</SubmitButton>
      </AksiBawah>
    </form>
  );
}
