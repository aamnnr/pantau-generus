"use client";

import { useActionState } from "react";
import { AksiBawah, Field, FormError, PilihanKartu, SubmitButton } from "@/components/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { pilihNilai, type FormState } from "@/lib/form";
import { LABEL_JENJANG, URUTAN_JENJANG, type Jenjang } from "@/lib/format";

type Awal = {
  tanggal: string;
  jam_mulai: string;
  jam_selesai: string;
  judul: string;
  kelas: string[];
  pengajar: string[];
  catatan: string;
};

export function KegiatanForm({ action, awal, kelas, guru, labelSimpan, hapus }: {
  action: (prev: FormState, data: FormData) => Promise<FormState>;
  awal: Awal;
  kelas: { id: string; nama: string; jenjang: Jenjang }[];
  guru: { id: string; nama: string }[];
  labelSimpan: string;
  hapus?: React.ReactNode;
}) {
  const [state, formAction] = useActionState(action, {});
  const v = pilihNilai(state, awal);
  const e = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <Field label="Tanggal" htmlFor="tanggal" error={e.tanggal}>
        <Input id="tanggal" name="tanggal" type="date" defaultValue={v.str("tanggal")} className="max-w-60" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Jam mulai" htmlFor="jam_mulai" error={e.jam_mulai}>
          <Input id="jam_mulai" name="jam_mulai" type="time" defaultValue={v.str("jam_mulai").slice(0, 5)} />
        </Field>
        <Field label="Jam selesai" htmlFor="jam_selesai" error={e.jam_selesai}>
          <Input id="jam_selesai" name="jam_selesai" type="time" defaultValue={v.str("jam_selesai").slice(0, 5)} />
        </Field>
      </div>
      <Field
        label={
          <>
            Judul <span className="font-normal text-muted-foreground">(opsional)</span>
          </>
        }
        htmlFor="judul"
        error={e.judul}
        hint="Contoh: Pengajian umum Remaja, Kajian Ramadhan"
      >
        <Input id="judul" name="judul" defaultValue={v.str("judul")} autoComplete="off" />
      </Field>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-base font-semibold">Kelas (lebih dari satu = kegiatan gabungan)</legend>
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

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-base font-semibold">Pengajar</legend>
        {guru.length ? (
          <PilihanKartu name="pengajar" type="checkbox" defaultValue={v.arr("pengajar")} kolom={2} options={guru.map((g) => ({ value: g.id, label: g.nama }))} />
        ) : (
          <p className="text-muted-foreground">Belum ada data guru.</p>
        )}
      </fieldset>

      <Field
        label={
          <>
            Catatan <span className="font-normal text-muted-foreground">(opsional)</span>
          </>
        }
        htmlFor="catatan"
        error={e.catatan}
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
