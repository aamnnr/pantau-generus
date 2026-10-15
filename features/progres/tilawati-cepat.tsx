"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { teksPosisiTilawati as teksPosisi } from "@/lib/format";
import { getar } from "@/lib/getar";
import { cn } from "@/lib/utils";
import { aturPosisiTilawati, tambahTilawati, type HasilTilawati } from "./actions";
import type { BarisTilawati } from "./queries";

type Posisi = NonNullable<BarisTilawati["posisi"]>;
type Jilid = { jilid: number; total_halaman: number };

/**
 * Tilawati Cepat (DESIGN §7.4a): +1/+2/+3/… per anak, Urungkan lewat toast,
 * tawaran naik jilid di akhir jilid, dan koreksi posisi dengan mengetuk posisi.
 */
export function TilawatiCepat({ baris, jilid, kegiatanId = null, bisa, polos }: {
  baris: BarisTilawati[];
  jilid: Jilid[];
  kegiatanId?: string | null;
  bisa: boolean;
  /** Tanpa kartu per anak, untuk dipakai di dalam kartu lain (Progres Anak). */
  polos?: boolean;
}) {
  const [posisi, setPosisi] = useState<Record<string, Posisi | null>>(() =>
    Object.fromEntries(baris.map((b) => [b.generus_id, b.posisi])),
  );
  const [sibuk, setSibuk] = useState<string | null>(null);
  const [, start] = useTransition();
  const [koreksi, setKoreksi] = useState<BarisTilawati | null>(null);
  const [lain, setLain] = useState<BarisTilawati | null>(null);
  const [naik, setNaik] = useState<{ b: BarisTilawati; jilid: number; halaman: number } | null>(null);

  function jalankan(b: BarisTilawati, kerja: () => Promise<HasilTilawati>, sesudah?: (h: Extract<HasilTilawati, { ok: true }>) => void) {
    setSibuk(b.generus_id);
    start(async () => {
      const h = await kerja();
      setSibuk(null);
      if (!h.ok) {
        toast.error(h.error);
        return;
      }
      setPosisi((p) => ({ ...p, [b.generus_id]: { jilid: h.jilid, halaman: h.halaman, total_halaman: h.total_halaman } }));
      sesudah?.(h);
    });
  }

  function atur(b: BarisTilawati, jilidBaru: number, halaman: number, naikJilid: boolean, pesan: string) {
    jalankan(
      b,
      () => aturPosisiTilawati({ generus_id: b.generus_id, jilid: jilidBaru, halaman, naik: naikJilid, kegiatan_id: kegiatanId }),
      (h) => toast.success(`${b.nama}: ${pesan} → ${teksPosisi(h)}`),
    );
  }

  function tambah(b: BarisTilawati, n: number) {
    getar();
    const sebelum = posisi[b.generus_id];
    jalankan(
      b,
      () => tambahTilawati({ generus_id: b.generus_id, tambahan: n, kegiatan_id: kegiatanId }),
      (h) => {
        toast.success(`${b.nama}: +${n} → ${teksPosisi(h)}`, {
          action: sebelum
            ? { label: "Urungkan", onClick: () => atur(b, sebelum.jilid, sebelum.halaman, false, "diurungkan") }
            : undefined,
        });
        if (h.total_halaman != null && h.halaman >= h.total_halaman) setNaik({ b, jilid: h.jilid + 1, halaman: h.sisa });
      },
    );
  }

  return (
    <>
      <ul className="flex flex-col gap-2.5">
        {baris.map((b) => {
          const p = posisi[b.generus_id];
          const tunggu = sibuk === b.generus_id;
          return (
            <li key={b.generus_id} className={cn("flex flex-col gap-3", !polos && "rounded-2xl bg-card p-3.5 border")}>
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                <span className="text-base font-medium">{b.nama}</span>
                {bisa && p ? (
                  <button
                    type="button"
                    onClick={() => setKoreksi(b)}
                    key={teksPosisi(p)}
                    className="h-8 animate-pop rounded-lg bg-mint px-2.5 text-sm font-semibold text-mint-foreground underline decoration-dotted underline-offset-4 transition-colors hover:bg-primary/15"
                    aria-label={`${teksPosisi(p)}. Ketuk untuk mengoreksi posisi ${b.nama}`}
                  >
                    {teksPosisi(p)}
                  </button>
                ) : (
                  <span className={cn("text-sm font-semibold", p ? "text-primary" : "text-muted-foreground")} aria-live="polite">
                    {teksPosisi(p)}
                  </span>
                )}
              </div>
              {bisa &&
                (p ? (
                  <div className="grid grid-cols-4 gap-2" aria-busy={tunggu}>
                    {[1, 2, 3].map((n) => (
                      <Button key={n} type="button" variant="outline" size="lg" disabled={tunggu} onClick={() => tambah(b, n)} className="h-11 text-lg font-bold tabular-nums">
                        +{n}
                      </Button>
                    ))}
                    <Button type="button" variant="outline" size="lg" disabled={tunggu} onClick={() => setLain(b)} className="h-11 text-lg font-bold tabular-nums" aria-label="Tambah halaman lain">
                      +…
                    </Button>
                  </div>
                ) : (
                  <Button type="button" variant="outline" size="lg" disabled={tunggu} onClick={() => setKoreksi(b)}>
                    Isi posisi awal
                  </Button>
                ))}
            </li>
          );
        })}
      </ul>

      <DialogPosisi
        b={koreksi}
        posisi={koreksi ? posisi[koreksi.generus_id] : null}
        jilid={jilid}
        onClose={() => setKoreksi(null)}
        onSimpan={(j, h) => {
          const b = koreksi!;
          setKoreksi(null);
          atur(b, j, h, false, posisi[b.generus_id] ? "dikoreksi" : "posisi awal");
        }}
      />

      <DialogAngka
        b={lain}
        onClose={() => setLain(null)}
        onSimpan={(n) => {
          const b = lain!;
          setLain(null);
          tambah(b, n);
        }}
      />

      <Dialog open={!!naik} onOpenChange={(v) => !v && setNaik(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Selesai Jilid {naik ? naik.jilid - 1 : ""}. Naik ke Jilid {naik?.jilid}?
            </DialogTitle>
            <DialogDescription>
              {naik?.b.nama} sudah sampai halaman terakhir.
              {naik && naik.halaman > 0 && ` Kelebihan ${naik.halaman} halaman dicatat di jilid baru.`}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 sm:flex-row-reverse">
            <Button
              type="button"
              size="lg"
              onClick={() => {
                const x = naik!;
                setNaik(null);
                atur(x.b, x.jilid, x.halaman, true, "naik jilid");
              }}
            >
              Ya, naik jilid
            </Button>
            <Button type="button" variant="outline" size="lg" onClick={() => setNaik(null)}>
              Belum
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function DialogPosisi({ b, posisi, jilid, onClose, onSimpan }: {
  b: BarisTilawati | null;
  posisi: Posisi | null;
  jilid: Jilid[];
  onClose: () => void;
  onSimpan: (jilid: number, halaman: number) => void;
}) {
  return (
    <Dialog open={!!b} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        {/* key: isian awal mengikuti anak yang dipilih */}
        {b && <IsiPosisi key={b.generus_id} b={b} posisi={posisi} jilid={jilid} onSimpan={onSimpan} />}
      </DialogContent>
    </Dialog>
  );
}

function IsiPosisi({ b, posisi, jilid, onSimpan }: {
  b: BarisTilawati;
  posisi: Posisi | null;
  jilid: Jilid[];
  onSimpan: (jilid: number, halaman: number) => void;
}) {
  const [j, setJ] = useState<number | null>(posisi?.jilid ?? jilid[0]?.jilid ?? null);
  const [h, setH] = useState(posisi ? String(posisi.halaman) : "");
  const total = jilid.find((x) => x.jilid === j)?.total_halaman;
  const nilai = h.trim() === "" ? null : Number(h);
  const salah = nilai == null || !Number.isInteger(nilai) || nilai < 0 || (total != null && nilai > total);

  return (
    <>
      <DialogHeader>
        <DialogTitle>{posisi ? "Koreksi posisi" : "Isi posisi awal"}</DialogTitle>
        <DialogDescription>{b.nama} — halaman terakhir yang sudah diselesaikan.</DialogDescription>
      </DialogHeader>
      {jilid.length === 0 ? (
        <p className="rounded-xl bg-muted px-4 py-3">Jumlah halaman tiap jilid belum diatur. Minta admin mengisinya di menu Jilid Tilawati.</p>
      ) : (
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (j != null && !salah) onSimpan(j, nilai!);
          }}
        >
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 font-semibold">Jilid</legend>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
              {jilid.map((x) => (
                <button
                  key={x.jilid}
                  type="button"
                  aria-pressed={j === x.jilid}
                  onClick={() => setJ(x.jilid)}
                  className={cn(
                    "h-11 rounded-lg border text-lg font-semibold",
                    j === x.jilid ? "border-primary bg-mint text-mint-foreground" : "border-input bg-card",
                  )}
                >
                  {x.jilid}
                </button>
              ))}
            </div>
          </fieldset>
          <label className="flex flex-col gap-2">
            <span className="font-semibold">Halaman</span>
            <Input inputMode="numeric" value={h} onChange={(e) => setH(e.target.value.replace(/\D/g, ""))} className="h-11 text-2xl font-semibold tabular-nums" autoFocus />
            {total != null && <span className="text-muted-foreground">Jilid {j} ada {total} halaman. Isi 0 bila baru mulai.</span>}
          </label>
          <Button type="submit" size="lg" disabled={j == null || salah}>
            Simpan Posisi
          </Button>
        </form>
      )}
    </>
  );
}

function DialogAngka({ b, onClose, onSimpan }: { b: BarisTilawati | null; onClose: () => void; onSimpan: (n: number) => void }) {
  const [n, setN] = useState("");
  const nilai = Number(n);
  const valid = n !== "" && Number.isInteger(nilai) && nilai >= 1 && nilai <= 99;
  return (
    <Dialog
      open={!!b}
      onOpenChange={(v) => {
        if (!v) {
          setN("");
          onClose();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tambah berapa halaman?</DialogTitle>
          <DialogDescription>{b?.nama}</DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!valid) return;
            setN("");
            onSimpan(nilai);
          }}
        >
          <Input inputMode="numeric" value={n} onChange={(e) => setN(e.target.value.replace(/\D/g, ""))} aria-label="Jumlah halaman" className="h-11 text-2xl font-semibold tabular-nums" autoFocus />
          <Button type="submit" size="lg" disabled={!valid}>
            Tambahkan
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
