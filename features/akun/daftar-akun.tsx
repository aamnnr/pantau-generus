"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Kosong } from "@/components/page";
import { formatNoHp, inisial, LABEL_PERAN, type Peran } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AkunRow } from "./queries";

type Filter = "semua" | Peran;
const FILTER: Filter[] = ["semua", "admin", "guru", "pengurus", "wali"];

export function DaftarAkun({ data, bisaUbah }: { data: AkunRow[]; bisaUbah: boolean }) {
  const [filter, setFilter] = useState<Filter>("semua");
  const tampil = data.filter((a) => filter === "semua" || a.peran.includes(filter));

  return (
    <div className="flex flex-col gap-4 px-4 lg:px-0">
      <div role="group" aria-label="Saring peran" className="flex gap-1 overflow-x-auto rounded-xl bg-secondary p-1 lg:w-fit">
        {FILTER.map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
            className={cn(
              "h-10 shrink-0 rounded-xl px-4 text-base font-medium text-muted-foreground",
              filter === f && "bg-card font-semibold text-primary shadow-[0_1px_3px_rgba(20,22,22,0.12)]",
            )}
          >
            {f === "semua" ? "Semua" : LABEL_PERAN[f]}
          </button>
        ))}
      </div>
      <p className="text-muted-foreground">{tampil.length} akun</p>

      {tampil.length === 0 ? (
        <Kosong judul="Belum ada akun dengan peran ini" />
      ) : (
        <ul className="berurutan grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-3">
          {tampil.map((a) => {
            const isi = (
              <>
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-warn-soft text-sm font-bold text-warn">
                  {inisial(a.nama)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-lg font-medium">{a.nama}</span>
                  <span className="block text-muted-foreground">{formatNoHp(a.no_hp)}</span>
                  <span className="block truncate text-muted-foreground">
                    {a.peran.map((p) => LABEL_PERAN[p]).join(" · ")}
                    {a.anak.length > 0 && ` — ${a.anak.join(", ")}`}
                  </span>
                </span>
                {bisaUbah && <ChevronRight aria-hidden className="size-6 shrink-0 text-muted-foreground" />}
              </>
            );
            const kelas = "flex min-h-16 items-center gap-3.5 rounded-2xl bg-card px-3.5 py-3 border";
            return (
              <li key={a.id}>
                {bisaUbah ? (
                  <Link href={`/kelola/akun/${a.id}`} className={cn(kelas, "transition-colors hover:border-primary/40 hover:bg-mint/40")}>
                    {isi}
                  </Link>
                ) : (
                  <div className={kelas}>{isi}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
