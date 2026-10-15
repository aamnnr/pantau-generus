import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { formatTanggalPendek, labelKelasKegiatan } from "@/lib/format";
import type { TargetRingkas } from "./queries";

export function KartuTarget({ t }: { t: TargetRingkas }) {
  const isi = [
    t.jumlah_kitab && `${t.jumlah_kitab} bacaan/makna`,
    t.jumlah_materi && `${t.jumlah_materi} butir materi`,
    t.ada_tilawati && "tilawati",
  ].filter(Boolean);

  return (
    <Link
      href={`/target/${t.id}`}
      className="flex min-h-24 items-center gap-3.5 rounded-2xl bg-card px-4 py-3.5 border transition-colors hover:border-primary/40 hover:bg-mint/40"
    >
      <span className="min-w-0 flex-1">
        <span className="block text-lg leading-snug font-semibold">{t.judul}</span>
        <span className="block text-muted-foreground tabular-nums">
          {formatTanggalPendek(t.mulai)} – {formatTanggalPendek(t.selesai)}
          {t.semester && ` · ${t.semester}`}
        </span>
        <span className="block font-medium">{labelKelasKegiatan(t.kelas)}</span>
        <span className="block text-muted-foreground">{isi.length ? isi.join(" · ") : "Isi target belum diisi"}</span>
      </span>
      <ChevronRight aria-hidden className="size-6 shrink-0 text-muted-foreground" />
    </Link>
  );
}
