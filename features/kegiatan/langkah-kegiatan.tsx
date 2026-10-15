"use client";

import { Check } from "lucide-react";
import { useState } from "react";
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
  // Empat langkah di HP 360px: "Kehadiran" disingkat agar label tidak terpotong.
  const daftar: { id: Langkah; label: string }[] = [
    { id: "materi", label: "Materi" },
    { id: "kehadiran", label: tilawati ? "Hadir" : "Kehadiran" },
    ...(tilawati ? [{ id: "tilawati" as const, label: "Tilawati" }] : []),
    { id: "selesai", label: "Selesai" },
  ];

  const panel = (id: Langkah, judul: string, isi: React.ReactNode) => (
    <section
      aria-labelledby={`judul-${id}`}
      className={cn("flex flex-col gap-4", aktif !== id && "max-lg:hidden", (id === "selesai" || id === "tilawati") && "lg:col-span-2")}
    >
      <h2 id={`judul-${id}`} className="flex items-center gap-2 text-xl font-semibold">
        {judul}
        {sudah[id] && (
          <span className="inline-flex items-center gap-1 rounded-full bg-mint px-2.5 text-base font-semibold text-mint-foreground">
            <Check aria-hidden className="size-4" /> sudah
          </span>
        )}
      </h2>
      {isi}
    </section>
  );

  return (
    <div className="flex flex-col gap-5 px-4 lg:px-0">
      <nav aria-label="Langkah" className="sticky top-0 z-20 -mx-4 bg-background/95 px-4 py-2 backdrop-blur lg:hidden">
        <ol className={cn("grid gap-1 rounded-2xl bg-secondary p-1", tilawati ? "grid-cols-4" : "grid-cols-3")}>
          {daftar.map((l, i) => (
            <li key={l.id}>
              <button
                type="button"
                aria-current={aktif === l.id ? "step" : undefined}
                onClick={() => {
                  setAktif(l.id);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={cn(
                  "flex w-full items-center justify-center rounded-xl text-base font-medium text-[#444444]",
                  tilawati ? "h-16 flex-col gap-0.5" : "h-12 gap-1.5",
                  aktif === l.id && "bg-card font-semibold text-primary shadow-sm",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full text-sm font-bold",
                    sudah[l.id] ? "bg-primary text-primary-foreground" : "bg-card ring-1 ring-input",
                  )}
                >
                  {sudah[l.id] ? <Check className="size-4" /> : i + 1}
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
