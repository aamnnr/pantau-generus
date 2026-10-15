import type { Metadata } from "next";

export const metadata: Metadata = { title: "Tidak ada koneksi · Pantau Generus" };

/** Ditampilkan service worker saat membuka halaman tanpa internet (statis, tanpa data pengguna). */
export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 px-6 text-center">
      <p className="text-lg font-semibold text-primary">Pantau Generus</p>
      <h1 className="text-2xl font-bold">Tidak ada koneksi internet</h1>
      <p className="text-muted-foreground">
        Aplikasi ini membutuhkan internet untuk menampilkan dan menyimpan data. Periksa sinyal atau Wi-Fi, lalu coba lagi.
      </p>
      {/* Tautan biasa (bukan tombol skrip) agar tetap berfungsi di halaman statis. */}
      <a href="/beranda" className="mx-auto flex h-11 items-center rounded-xl bg-primary px-8 text-lg font-semibold text-primary-foreground">
        Coba lagi
      </a>
    </main>
  );
}
