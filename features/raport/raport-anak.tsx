import { formatAngka, persen } from "@/components/progres";
import type { ProgresAnak } from "@/features/progres/queries";
import {
  formatTanggalPendek,
  LABEL_ASPEK,
  LABEL_PRESENSI,
  labelKelas,
  labelPenilaian,
  teksPosisiTilawati,
  URUTAN_ASPEK,
  URUTAN_PRESENSI,
} from "@/lib/format";
import type { Periode } from "@/lib/periode";
import { cn } from "@/lib/utils";

const JUDUL: Record<Periode["jenis"], string> = {
  bulan: "Raport Bulanan",
  target: "Raport Periode Target",
  semester: "Raport Semester",
  semua: "Raport Keseluruhan",
};

/** Raport dicetak tegak A4. */
export function GayaCetakRaport() {
  return <style>{"@media print { @page { size: A4 portrait; margin: 15mm; } }"}</style>;
}

const SIMBOL = { belum: "○", proses: "◐", lancar: "●" } as const;

/**
 * Raport per anak (PRD F7, DESIGN §7.7): A4 portrait, tabel bergaris agar tetap terbaca
 * saat dicetak hitam-putih. Isinya sama dengan Progres Anak pada periode yang sama.
 */
export function RaportAnak({ d, periode, kelompok, catatan, children, className }: {
  d: ProgresAnak;
  periode: Periode;
  kelompok: string;
  catatan: { bulan: string; catatan: string }[];
  /** Isian catatan (hanya di layar, untuk yang berhak). */
  children?: React.ReactNode;
  className?: string;
}) {
  const h = d.kehadiran.periode;
  const satuan = (jenis: string | null) => (jenis === "quran" ? "ayat" : "hal.");
  const terlewat = d.kitab.filter((k) => k.terlewat.length);

  return (
    <article
      className={cn(
        "raport mx-auto flex w-full max-w-[210mm] flex-col gap-5 rounded-2xl bg-card p-5 text-base shadow-[0_1px_2px_rgba(18,20,19,0.06)] lg:p-8",
        "print:max-w-none print:gap-3 print:rounded-none print:p-0 print:text-[11pt] print:shadow-none",
        className,
      )}
    >
      <header className="flex flex-col gap-1 border-b-2 border-foreground pb-3 text-center">
        <p className="text-lg font-bold uppercase">{kelompok || "Kelompok Pengajian"}</p>
        <h1 className="text-2xl font-bold print:text-[16pt]">{JUDUL[periode.jenis]}</h1>
        <p className="text-muted-foreground print:text-foreground">{periode.label}</p>
      </header>

      <table className="w-full text-left">
        <tbody>
          <BarisIdentitas label="Nama" isi={d.anak.nama} />
          <BarisIdentitas label="Kelas" isi={d.anak.kelas ? labelKelas(d.anak.kelas) : "—"} />
          <BarisIdentitas
            label="Periode target"
            isi={d.target ? `${d.target.judul} (${formatTanggalPendek(d.target.mulai)} – ${formatTanggalPendek(d.target.selesai)})` : "—"}
          />
        </tbody>
      </table>

      <Bagian judul="1. Kehadiran">
        {h && h.total > 0 ? (
          <Tabel kepala={[...URUTAN_PRESENSI.map((s) => LABEL_PRESENSI[s]), "Kehadiran"]}>
            <tr>
              {URUTAN_PRESENSI.map((s) => (
                <Sel key={s} tengah>
                  {h[s]}
                </Sel>
              ))}
              <Sel tengah tebal>
                {h.persen}% dari {h.total} pengajian
              </Sel>
            </tr>
          </Tabel>
        ) : (
          <p>Belum ada kehadiran yang tercatat pada periode ini.</p>
        )}
      </Bagian>

      <Bagian judul="2. Bacaan & makna">
        {d.target && d.target.kitab.length > 0 && (
          <Tabel kepala={["Target periode", "Capaian anak", "Disampaikan di kelas"]}>
            {d.target.kitab.map((x) => (
              <tr key={x.id}>
                <Sel>
                  {x.jenis === "bacaan" ? "Bacaan" : `Makna ${x.kitab_nama}`}: {x.teks}
                </Sel>
                <Sel tebal>
                  {persen(x.diikuti, x.total)}% ({formatAngka(x.diikuti)}/{formatAngka(x.total)} {satuan(x.kitab_jenis)})
                </Sel>
                <Sel>
                  {formatAngka(x.kelas)} {satuan(x.kitab_jenis)}
                </Sel>
              </tr>
            ))}
          </Tabel>
        )}
        {d.kitab.length > 0 ? (
          <Tabel kepala={["Materi pada periode ini", "Diikuti anak", "Disampaikan di kelas"]}>
            {d.kitab.map((k) => (
              <tr key={`${k.kitab_id}-${k.jenis}`}>
                <Sel>
                  {k.jenis === "bacaan" ? "Bacaan" : "Makna"} {k.kitab_nama}
                </Sel>
                <Sel tebal>
                  {formatAngka(k.diikuti!)} {satuan(k.kitab_jenis)}
                  {k.kelas ? ` (${persen(k.diikuti!, k.kelas)}%)` : ""}
                </Sel>
                <Sel>
                  {formatAngka(k.kelas!)} {satuan(k.kitab_jenis)}
                </Sel>
              </tr>
            ))}
          </Tabel>
        ) : (
          <p>Belum ada materi bacaan atau makna pada periode ini.</p>
        )}
      </Bagian>

      <Bagian judul="3. Hafalan, kefahaman, akhlaq & kemandirian">
        {d.materi.length ? (
          <Tabel kepala={["Aspek", "Butir materi", "Status", "Sudah menerima"]}>
            {URUTAN_ASPEK.flatMap((a) =>
              d.materi
                .filter((m) => m.aspek === a)
                .map((m, i, isi) => (
                  <tr key={m.materi_item_id}>
                    {i === 0 && (
                      <Sel rowSpan={isi.length} tebal>
                        {LABEL_ASPEK[a]}
                      </Sel>
                    )}
                    <Sel>
                      {m.judul}
                      <span className="text-muted-foreground print:text-foreground"> · {m.keterangan}</span>
                      {m.target && <span className="font-semibold"> (target)</span>}
                    </Sel>
                    <Sel tebal>
                      {m.status ? `${SIMBOL[m.status]} ${labelPenilaian(m.aspek, m.status)}` : "○ Belum dinilai"}
                    </Sel>
                    <Sel tengah>{m.diterima ? "✓" : "–"}</Sel>
                  </tr>
                )),
            )}
          </Tabel>
        ) : (
          <p>Belum ada butir materi.</p>
        )}
      </Bagian>

      {d.anak.kelas?.jenjang === "caberawit" && (
        <Bagian judul="4. Tilawati">
          <p>
            Posisi sekarang: <strong>{teksPosisiTilawati(d.tilawati)}</strong>
            {d.target?.tilawati && <> · Target: {teksPosisiTilawati(d.target.tilawati)}</>}
          </p>
        </Bagian>
      )}

      <Bagian judul={`${d.anak.kelas?.jenjang === "caberawit" ? 5 : 4}. Materi terlewat`}>
        {terlewat.length ? (
          <ul className="list-disc pl-6">
            {terlewat.map((k) => (
              <li key={`${k.kitab_id}-${k.jenis}`}>
                {k.jenis === "bacaan" ? "Bacaan" : "Makna"} {k.kitab_nama}: {k.terlewat.map((r) => r.teks).join(", ")}
              </li>
            ))}
          </ul>
        ) : (
          <p>Tidak ada materi terlewat.</p>
        )}
      </Bagian>

      <Bagian judul={`${d.anak.kelas?.jenjang === "caberawit" ? 6 : 5}. Catatan`}>
        {catatan.length ? (
          catatan.map((c) => (
            <p key={c.bulan} className="whitespace-pre-line">
              {catatan.length > 1 && <span className="font-semibold">{formatTanggalPendek(c.bulan).replace(/^1 /, "")}: </span>}
              {c.catatan}
            </p>
          ))
        ) : (
          <p className="hidden min-h-16 print:block" />
        )}
        {children}
      </Bagian>

      <footer className="mt-4 grid grid-cols-2 gap-8 text-center print:mt-8 print:break-inside-avoid">
        <div>
          <p>Orang tua/Wali</p>
          <p className="mt-16 border-t border-foreground pt-1">(...........................)</p>
        </div>
        <div>
          <p>Pengajar/Pengurus</p>
          <p className="mt-16 border-t border-foreground pt-1">(...........................)</p>
        </div>
      </footer>
    </article>
  );
}

function BarisIdentitas({ label, isi }: { label: string; isi: string }) {
  return (
    <tr>
      <th scope="row" className="w-40 py-0.5 pr-3 align-top font-semibold">
        {label}
      </th>
      <td className="py-0.5">: {isi}</td>
    </tr>
  );
}

function Bagian({ judul, children }: { judul: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2 print:break-inside-avoid">
      <h2 className="text-lg font-bold print:text-[12pt]">{judul}</h2>
      {children}
    </section>
  );
}

function Tabel({ kepala, children }: { kepala: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[480px] border-collapse text-left print:min-w-0">
        <thead>
          <tr className="bg-mint text-mint-foreground print:bg-transparent print:text-foreground">
            {kepala.map((k) => (
              <th key={k} scope="col" className="border border-foreground/30 px-2 py-1.5 font-semibold print:border-foreground">
                {k}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function Sel({ children, tengah, tebal, rowSpan }: { children: React.ReactNode; tengah?: boolean; tebal?: boolean; rowSpan?: number }) {
  return (
    <td
      rowSpan={rowSpan}
      className={cn("border border-foreground/30 px-2 py-1.5 align-top print:border-foreground", tengah && "text-center", tebal && "font-semibold")}
    >
      {children}
    </td>
  );
}
