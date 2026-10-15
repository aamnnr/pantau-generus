/// <reference lib="esnext" />
/// <reference lib="webworker" />
import { CacheFirst, ExpirationPlugin, NetworkOnly, type PrecacheEntry, Serwist, type SerwistGlobalConfig } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

/**
 * Service worker sengaja minimal (PRD §3: mode offline bukan tujuan versi pertama):
 * hanya aset statis yang di-cache. Halaman & data selalu dari jaringan agar tidak ada data
 * anak yang tertinggal di HP bersama setelah keluar, dan tidak ada data basi.
 * Tanpa koneksi, navigasi menampilkan /~offline.
 */
const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      matcher: ({ url, sameOrigin }) => sameOrigin && (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/ikon/")),
      handler: new CacheFirst({
        cacheName: "aset-statis",
        plugins: [new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 })],
      }),
    },
    { matcher: () => true, handler: new NetworkOnly() },
  ],
  fallbacks: {
    entries: [{ url: "/~offline", matcher: ({ request }) => request.destination === "document" }],
  },
});

serwist.addEventListeners();
