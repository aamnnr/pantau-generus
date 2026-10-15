import { SerwistProvider } from "@serwist/turbopack/react";
import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Pantau Generus",
  description: "Pemantauan kehadiran, materi, dan capaian target generus",
  applicationName: "Pantau Generus",
  appleWebApp: { capable: true, title: "Generus", statusBarStyle: "default" },
  icons: { apple: "/ikon/apple-180.png" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#019147",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${poppins.variable} h-full antialiased`}>
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
