import { ChevronRight, UserRound, UsersRound } from "lucide-react";
import Link from "next/link";
import { StatusChip, type Nada } from "@/components/status-chip";
import { formatJam, labelKelasKegiatan } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { KegiatanRingkas } from "./queries";

/** Status kartu (DESIGN §7.2): Belum diisi / Sudah diisi / Selesai / Libur — selalu simbol + kata. */
export function statusKegiatan(k: KegiatanRingkas): { label: string; nada: Nada; simbol: string } {
  if (k.status === "batal") return { label: "Libur", nada: "abu", simbol: "○" };
  if (k.status === "selesai") return { label: "Selesai", nada: "hijau", simbol: "✓" };
  if (k.jumlah_presensi > 0) return { label: "Sudah diisi", nada: "biru", simbol: "◐" };
  return { label: "Belum diisi", nada: "kunyit", simbol: "!" };
}

/** Kartu kegiatan: blok jam di kiri (pola kartu kursus referensi), kelas & pengajar, status. */
export function KartuKegiatan({ k }: { k: KegiatanRingkas }) {
  const status = statusKegiatan(k);
  const mulai = formatJam(k.jam_mulai);
  return (
    <Link
      href={`/kegiatan/${k.id}`}
      className={cn(
        "group flex items-center gap-3.5 rounded-2xl border bg-card p-3.5 transition-[border-color,box-shadow,transform] duration-200 ease-(--ease-halus) hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_6px_18px_rgba(20,22,22,0.06)] active:scale-[0.99]",
        k.status === "batal" && "opacity-70",
      )}
    >
      <span className="flex size-14 shrink-0 flex-col items-center justify-center rounded-xl bg-mint text-mint-foreground">
        <span className="text-base leading-none font-bold tabular-nums">{mulai || "—"}</span>
        {k.jam_selesai && <span className="mt-1 text-xs leading-none tabular-nums opacity-80">s.d. {formatJam(k.jam_selesai)}</span>}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-2">
          <span className="min-w-0">
            <span className="block truncate text-lg leading-snug font-semibold">{labelKelasKegiatan(k.kelas)}</span>
            {k.judul && <span className="block truncate text-sm text-teks-2">{k.judul}</span>}
          </span>
          <StatusChip nada={status.nada} simbol={status.simbol}>
            {status.label}
          </StatusChip>
        </span>
        <span className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <UserRound aria-hidden className="size-3.5" />
            {k.pengajar.length ? k.pengajar.join(", ") : "Pengajar belum diisi"}
          </span>
          {k.jumlah_presensi > 0 && (
            <span className="inline-flex items-center gap-1">
              <UsersRound aria-hidden className="size-3.5" />
              {k.jumlah_presensi} tercatat
            </span>
          )}
        </span>
      </span>
      <ChevronRight aria-hidden className="size-5 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5" />
    </Link>
  );
}
