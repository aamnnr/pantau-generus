import type { MetadataRoute } from "next";

/** PWA (PRD F8, DESIGN §10): bisa dipasang ke layar utama, tampil tanpa bilah peramban. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pantau Generus",
    short_name: "Generus",
    description: "Pemantauan kehadiran, materi, dan capaian target generus",
    lang: "id",
    start_url: "/beranda",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    theme_color: "#019147",
    background_color: "#ffffff",
    icons: [
      { src: "/ikon/192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/ikon/512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/ikon/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
