import { BookOpenCheck, ChartColumn, ClipboardCheck } from "lucide-react";
import type { Metadata } from "next";
import { Logo } from "@/components/logo";
import { MasukForm } from "@/features/auth/masuk-form";

export const metadata: Metadata = { title: "Masuk · Pantau Generus" };

const FITUR = [
  { ikon: ClipboardCheck, teks: "Presensi cepat setiap pengajian" },
  { ikon: BookOpenCheck, teks: "Materi, hafalan, dan target per periode" },
  { ikon: ChartColumn, teks: "Progres & raport tiap anak" },
];

export default function MasukPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-8 lg:py-12">
      <div className="grid w-full max-w-4xl animate-muncul overflow-hidden rounded-3xl border bg-card lg:grid-cols-[1fr_1.05fr]">
        {/* Panel kiri (desktop): pesan singkat aplikasi, tenang tanpa ilustrasi ramai. */}
        <section className="hidden flex-col justify-between gap-10 bg-[linear-gradient(160deg,#0f8f8a,#0d807c_45%,#0b6b68)] p-10 text-white lg:flex">
          <Logo className="[&>span:last-child]:text-white" />
          <div className="flex flex-col gap-5">
            <h2 className="text-3xl leading-tight font-bold">Pantau perkembangan generus dengan rapi.</h2>
            <ul className="flex flex-col gap-3">
              {FITUR.map(({ ikon: Ikon, teks }) => (
                <li key={teks} className="flex items-center gap-3 text-base text-white/90">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/15">
                    <Ikon aria-hidden className="size-4" />
                  </span>
                  {teks}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-sm text-white/70">Akun dibuat oleh admin kelompok.</p>
        </section>

        <section className="flex flex-col gap-7 p-6 sm:p-10">
          <Logo className="lg:hidden" />
          <div>
            <h1 className="text-2xl font-bold">Assalamu&apos;alaikum</h1>
            <p className="mt-1 text-base text-muted-foreground">Silakan masuk dengan No. HP dan PIN Anda.</p>
          </div>
          <MasukForm />
        </section>
      </div>
    </main>
  );
}
