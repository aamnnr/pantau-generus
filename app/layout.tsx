import { SerwistProvider } from "@serwist/turbopack/react";
import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

// Font variabel: satu berkas untuk semua ketebalan (DESIGN §2).
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pantau Generus",
  description: "Pemantauan kehadiran, materi, dan capaian target generus",
  applicationName: "Pantau Generus",
  appleWebApp: { capable: true, title: "Generus", statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#f3f5f5",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${jakarta.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {/* Tanpa SW di dev (aset berubah terus). Tidak memuat ulang saat sinyal kembali agar isian
            presensi/materi yang belum disimpan tidak hilang; halaman tidak di-cache (lihat app/sw.ts). */}
        <SerwistProvider
          swUrl="/serwist/sw.js"
          disable={process.env.NODE_ENV === "development"}
          cacheOnNavigation={false}
          reloadOnOnline={false}
        >
          {children}
        </SerwistProvider>
      </body>
    </html>
  );
}
