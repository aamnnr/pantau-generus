"use client";

import { Copy } from "lucide-react";
import { useActionState } from "react";
import { AksiBawah, Field, FormError, PilihanKartu, SubmitButton } from "@/components/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { pilihNilai, type FormState } from "@/lib/form";
import { formatTanggalPendek, LABEL_JENJANG, labelKelasKegiatan, URUTAN_JENJANG, type Jenjang } from "@/lib/format";

type Awal = { judul: string; semester: string; mulai: string; selesai: string; kelas: string[]; catatan: string; salin_dari: string };
type Sumber = { id: string; judul: string; mulai: string; selesai: string; kelas: { nama: string; jenjang: Jenjang }[] };

export function TargetForm({ action, awal, kelas, sumberSalin, labelSimpan, hapus }: {
  action: (prev: FormState, data: FormData) => Promise<FormState>;
  awal: Awal;
  kelas: { id: string; nama: string; jenjang: Jenjang }[];
  /** Hanya saat membuat target baru: periode sebelumnya yang isinya bisa disalin. */
  sumberSalin?: Sumber[];
  labelSimpan: string;
  hapus?: React.ReactNode;
}) {
  const [state, formAction] = useActionState(action, {});
  const v = pilihNilai(state, awal);
  const e = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {sumberSalin && sumberSalin.length > 0 && (
        <fieldset className="flex flex-col gap-2 rounded-2xl bg-mint p-3.5">
          <legend className="sr-only">Salin isi</legend>
          <p className="flex items-center gap-2 text-lg font-semibold text-mint-foreground">
            <Copy aria-hidden className="size-5" />
            Salin isi dari periode sebelumnya
          </p>
          <p className="text-mint-foreground">Bacaan, makna, dan butir materi ikut tersalin; nanti tinggal disesuaikan.</p>
          <PilihanKartu
            name="salin_dari"
            kolom={2}
            defaultValue={[v.str("salin_dari")]}
            options={[
              { value: "", label: "Tidak, mulai kosong" },
              ...sumberSalin.map((s) => ({
                value: s.id,
                label: s.judul,
                sub: `${formatTanggalPendek(s.mulai)} – ${formatTanggalPendek(s.selesai)} · ${labelKelasKegiatan(s.kelas)}`,
              })),
            ]}
          />
        </fieldset>
      )}

      <Field label="Judul periode" htmlFor="judul" error={e.judul} hint="Sesuai dokumen PPG, mis. Periode Bulan Oktober">
        <Input id="judul" name="judul" defaultValue={v.str("judul")} autoComplete="off" />
      </Field>
      <Field
        label={
          <>
            Semester <span className="font-normal text-muted-foreground">(opsional)</span>
          </>
        }
        htmlFor="semester"
        error={e.semester}
        hint="mis. Semester 1 - 2026"
      >
        <Input id="semester" name="semester" defaultValue={v.str("semester")} autoComplete="off" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Mulai" htmlFor="mulai" error={e.mulai}>
          <Input id="mulai" name="mulai" type="date" defaultValue={v.str("mulai")} />
        </Field>
        <Field label="Selesai" htmlFor="selesai" error={e.selesai}>
          <Input id="selesai" name="selesai" type="date" defaultValue={v.str("selesai")} />
        </Field>
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-base font-semibold">Berlaku untuk kelas (boleh lebih dari satu)</legend>
        {URUTAN_JENJANG.map((j) => {
          const isi = kelas.filter((k) => k.jenjang === j);
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
        {kelas.length === 0 && <p className="text-muted-foreground">Anda belum tercatat mengajar kelas mana pun.</p>}
        {e.kelas?.map((m) => (
          <p key={m} className="font-medium text-destructive">
            {m}
          </p>
        ))}
      </fieldset>

      <Field
        label={
          <>
            Strategi pembelajaran / catatan <span className="font-normal text-muted-foreground">(opsional)</span>
          </>
        }
        htmlFor="catatan"
        error={e.catatan}
        hint="mis. Disampaikan dalam KBM 1 jam per minggu ditambah nderes di rumah"
      >
        <Textarea id="catatan" name="catatan" defaultValue={v.str("catatan")} />
      </Field>

      <FormError error={state.error} />
      <AksiBawah>
        {hapus}
        <SubmitButton>{labelSimpan}</SubmitButton>
      </AksiBawah>
    </form>
  );
}
