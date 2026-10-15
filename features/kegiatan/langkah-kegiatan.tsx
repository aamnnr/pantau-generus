"use client";

import { Check } from "lucide-react";
import { useState } from "react";
import { IndikatorGeser } from "@/components/indikator-geser";
import { cn } from "@/lib/utils";

type Langkah = "materi" | "kehadiran" | "tilawati" | "selesai";

/**
 * HP: tiga langkah berurutan dengan indikator ✓ (DESIGN §7.3).
 * Desktop: Materi & Kehadiran berdampingan, Tilawati & Selesai di bawah (DESIGN §5.1).
 * Langkah Tilawati hanya ada bila kegiatan mencakup kelas Caberawit (DESIGN §7.4a).
 */
export function LangkahKegiatan({ materi, kehadiran, tilawati, selesai, sudah }: {
  materi: React.ReactNode;
  kehadiran: React.ReactNode;
  tilawati?: React.ReactNode;
  selesai: React.ReactNode;
  sudah: Record<Langkah, boolean>;
}) {
  const [aktif, setAktif] = useState<Langkah>(() => {
    if (!sudah.materi) return "materi";
    if (!sudah.kehadiran) return "kehadiran";
    if (tilawati && !sudah.tilawati) return "tilawati";
    return "selesai";
  });
  // Empat langkah di HP 360px: indikator di atas label, teks 13px agar "Kehadiran" muat.
  const daftar: { id: Langkah; label: string }[] = [
    { id: "materi", label: "Materi" },
    { id: "kehadiran", label: "Kehadiran" },
    ...(tilawati ? [{ id: "tilawati" as const, label: "Tilawati" }] : []),
    { id: "selesai", label: "Selesai" },
  ];

  const panel = (id: Langkah, judul: string, isi: React.ReactNode) => (
    <section
      aria-labelledby={`judul-${id}`}
      className={cn("flex animate-muncul flex-col gap-3", aktif !== id && "max-lg:hidden", (id === "selesai" || id === "tilawati") && "lg:col-span-2")}
    >
      <h2 id={`judul-${id}`} className="flex items-center gap-2 text-lg font-semibold">
        {judul}
        {sudah[id] && (
          <span className="inline-flex h-6 animate-pop items-center gap-1 rounded-full bg-mint px-2 text-sm font-semibold text-mint-foreground">
            <Check aria-hidden className="size-3.5" /> sudah
          </span>
        )}
      </h2>
      {isi}
    </section>
  );

  return (
    <div className="flex flex-col gap-5 px-4 lg:px-0">
      <nav aria-label="Langkah" className="sticky top-0 z-20 -mx-4 bg-background/90 px-4 py-2 backdrop-blur-md lg:hidden">
        <ol className={cn("relative grid gap-1 rounded-xl bg-secondary p-1", tilawati ? "grid-cols-4" : "grid-cols-3")}>
          <IndikatorGeser indeks={daftar.findIndex((l) => l.id === aktif)} jumlah={daftar.length} />
          {daftar.map((l, i) => (
            <li key={l.id} className="relative z-10">
              <button
                type="button"
                aria-current={aktif === l.id ? "step" : undefined}
                onClick={() => {
                  setAktif(l.id);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={cn(
                  "flex w-full items-center justify-center rounded-lg text-base font-medium text-muted-foreground transition-colors duration-200",
                  tilawati ? "h-14 flex-col gap-1 text-sm" : "h-10 gap-1.5",
                  aktif === l.id && "font-semibold text-primary",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "flex size-5 items-center justify-center rounded-full text-xs font-bold transition-colors duration-200",
                    sudah[l.id] ? "bg-primary text-primary-foreground" : "bg-card ring-1 ring-input",
                  )}
                >
                  {sudah[l.id] ? <Check className="size-3.5" /> : i + 1}
                </span>
                {l.label}
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-start">
        {panel("materi", "Materi", materi)}
        {panel("kehadiran", "Kehadiran", kehadiran)}
        {tilawati && panel("tilawati", "Tilawati", tilawati)}
        {panel("selesai", "Selesai", selesai)}
      </div>
    </div>
  );
}
