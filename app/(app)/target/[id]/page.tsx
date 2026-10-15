import { Pencil } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BackLink, Halaman, Kartu, SkeletonDaftar } from "@/components/page";
import { StatusChip } from "@/components/status-chip";
import { Button } from "@/components/ui/button";
import { daftarSurat, kitabAktif } from "@/features/kegiatan/queries";
import { simpanIsiTarget } from "@/features/target/actions";
import { IsiTargetEditor } from "@/features/target/isi-target-editor";
import { ambilTarget, daftarJilid, opsiMateriTarget } from "@/features/target/queries";
import { getSession } from "@/lib/auth/session";
import { formatTanggal, LABEL_ASPEK, labelKelasKegiatan, URUTAN_ASPEK } from "@/lib/format";

export const metadata: Metadata = { title: "Target · Pantau Generus" };

async function Isi({ params }: { params: Promise<{ id: string }> }) {
  await getSession();
  const { id } = await params;
  const t = await ambilTarget(id);
  if (!t) notFound();

  const jenjang = [...new Set(t.kelas.map((k) => k.jenjang))];
  const adaCaberawit = jenjang.includes("caberawit");
  const [kitab, surat, opsiMateri, jilid] = t.boleh_kelola
    ? await Promise.all([kitabAktif(), daftarSurat(), opsiMateriTarget(jenjang, t.materi.map((m) => m.id)), daftarJilid()])
    : [[], [], [], []];

  return (
    <>
      <header className="flex flex-col gap-2 px-4 pt-4 lg:p-0">
        <BackLink href="/target" label="Target" />
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold">{t.judul}</h1>
            <p className="text-muted-foreground">
              {formatTanggal(t.mulai)} – {formatTanggal(t.selesai)}
              {t.semester && ` · ${t.semester}`}
            </p>
            <p className="text-lg font-medium">{labelKelasKegiatan(t.kelas)}</p>
          </div>
          {t.boleh_kelola && (
            <Button asChild variant="outline">
              <Link href={`/target/${t.id}/ubah`}>
                <Pencil aria-hidden />
                Ubah info
              </Link>
            </Button>
          )}
        </div>
        {t.catatan && <p className="rounded-xl border border-primary/20 bg-mint px-3.5 py-2.5 whitespace-pre-line text-mint-foreground">{t.catatan}</p>}
      </header>

      <div className="px-4 lg:px-0">
        {t.boleh_kelola ? (
          <IsiTargetEditor
            kitab={kitab}
            surat={surat}
            awalKitab={t.kitab.map((x) => ({
              kitab_id: x.kitab_id!,
              jenis: x.jenis!,
              mulai: x.mulai!,
              selesai: x.selesai!,
              mulai_surat: x.mulai_surat,
              mulai_ayat: x.mulai_ayat,
              selesai_surat: x.selesai_surat,
              selesai_ayat: x.selesai_ayat,
            }))}
            opsiMateri={opsiMateri}
            awalMateri={t.materi.map((m) => m.id)}
            jilid={jilid}
            awalTilawati={t.tilawati}
            adaCaberawit={adaCaberawit}
            action={simpanIsiTarget.bind(null, t.id)}
          />
        ) : (
          <IsiTargetBaca t={t} adaCaberawit={adaCaberawit} />
        )}
      </div>
    </>
  );
}

/** Tampilan baca untuk pengurus, wali, dan guru kelas lain. */
function IsiTargetBaca({ t, adaCaberawit }: { t: NonNullable<Awaited<ReturnType<typeof ambilTarget>>>; adaCaberawit: boolean }) {
  const baris = (jenis: "bacaan" | "makna") => t.kitab.filter((x) => x.jenis === jenis);
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      {URUTAN_ASPEK.map((a) => {
        const materi = t.materi.filter((m) => m.aspek === a);
        const kitabBaris = a === "alim" ? [...baris("bacaan"), ...baris("makna")] : [];
        return (
          <Kartu key={a} className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold text-primary">{LABEL_ASPEK[a]}</h2>
            {kitabBaris.map((x) => (
              <p key={x.id} className="rounded-xl bg-mint px-4 py-2.5 text-mint-foreground">
                <span className="font-semibold">{x.jenis === "bacaan" ? "Bacaan" : `Makna ${x.kitab_nama}`}:</span> {x.teks}
              </p>
            ))}
            {materi.map((m) => (
              <p key={m.id} className="flex items-center justify-between gap-2 rounded-xl bg-muted px-4 py-2.5">
                <span>
                  <span className="block font-medium">{m.nama}</span>
                  <span className="text-muted-foreground">{m.mapel}</span>
                </span>
                {m.jenis_kelamin && <StatusChip nada="ungu">{m.jenis_kelamin === "laki_laki" ? "Putra" : "Putri"}</StatusChip>}
              </p>
            ))}
            {kitabBaris.length === 0 && materi.length === 0 && <p className="text-muted-foreground">Tidak ada target.</p>}
          </Kartu>
        );
      })}
      {adaCaberawit && (
        <Kartu className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-primary">Tilawati</h2>
          <p>{t.tilawati ? `Jilid ${t.tilawati.jilid} sampai hal. ${t.tilawati.halaman}` : "Tidak ada target."}</p>
        </Kartu>
      )}
    </div>
  );
}

export default function TargetDetailPage({ params }: PageProps<"/target/[id]">) {
  return (
    <Halaman>
      <Suspense fallback={<SkeletonDaftar baris={4} />}>
        <Isi params={params} />
      </Suspense>
    </Halaman>
  );
}
