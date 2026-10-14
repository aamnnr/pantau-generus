import { ChevronRight, Clock, UserRound } from "lucide-react";
import Link from "next/link";
import { StatusChip, type Nada } from "@/components/status-chip";
import { formatRentangJam, labelKelasKegiatan } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { KegiatanRingkas } from "./queries";

/** Status kartu (DESIGN §7.2): Belum diisi / Sudah diisi / Selesai / Libur — selalu simbol + kata. */
export function statusKegiatan(k: KegiatanRingkas): { label: string; nada: Nada; simbol: string } {
  if (k.status === "batal") return { label: "Libur", nada: "abu", simbol: "○" };
  if (k.status === "selesai") return { label: "Selesai", nada: "hijau", simbol: "✓" };
  if (k.jumlah_presensi > 0) return { label: "Sudah diisi", nada: "biru", simbol: "◐" };
  return { label: "Belum diisi", nada: "kunyit", simbol: "!" };
}

export function KartuKegiatan({ k }: { k: KegiatanRingkas }) {
  const status = statusKegiatan(k);
  const jam = formatRentangJam(k.jam_mulai, k.jam_selesai);
  return (
    <Link
      href={`/kegiatan/${k.id}`}
      className={cn(
        "flex min-h-24 items-center gap-3.5 rounded-2xl bg-card px-4 py-3.5 shadow-[0_1px_2px_rgba(18,20,19,0.06)] hover:bg-mint/60",
        k.status === "batal" && "opacity-75",
      )}
    >
      <span className="min-w-0 flex-1">
        <span className="block text-lg leading-snug font-semibold">{labelKelasKegiatan(k.kelas)}</span>
        {k.judul && <span className="block text-base">{k.judul}</span>}
        <span className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
          {jam && (
            <span className="inline-flex items-center gap-1.5">
              <Clock aria-hidden className="size-4" />
              {jam}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5">
            <UserRound aria-hidden className="size-4" />
            {k.pengajar.length ? k.pengajar.join(", ") : "Pengajar belum diisi"}
          </span>
        </span>
      </span>
      <StatusChip nada={status.nada} simbol={status.simbol}>
        {status.label}
      </StatusChip>
      <ChevronRight aria-hidden className="size-6 shrink-0 text-muted-foreground" />
    </Link>
  );
}
