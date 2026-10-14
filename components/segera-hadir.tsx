import { Suspense } from "react";
import { Halaman, Kartu, Konten, PageHeader } from "@/components/page";
import { getSession } from "@/lib/auth/session";

async function Sapaan() {
  const { nama } = await getSession();
  return <>Assalamu&apos;alaikum, {nama}</>;
}

/** Halaman sementara untuk fitur tahap berikutnya (PRD §8) agar navigasi tidak buntu. */
export function SegeraHadir({ judul, tahap, isi }: { judul: string; tahap: number; isi: string }) {
  return (
    <Halaman>
      <PageHeader
        title={judul}
        subtitle={
          <Suspense fallback={<span className="opacity-0">.</span>}>
            <Sapaan />
          </Suspense>
        }
      />
      <Konten>
        <Kartu className="flex flex-col gap-2">
          <p className="text-lg font-semibold">Segera hadir</p>
          <p className="text-muted-foreground">
            {isi} Fitur ini dibangun pada Tahap {tahap}.
          </p>
        </Kartu>
      </Konten>
    </Halaman>
  );
}
