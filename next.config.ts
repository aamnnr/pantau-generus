import { withSerwist } from "@serwist/turbopack";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  // Tidak ada halaman di "/" — pengalihan di config agar tidak terjadi saat prerender.
  async redirects() {
    return [{ source: "/", destination: "/beranda", permanent: false }];
  },
  partialPrefetching: true,
  // Header keamanan dasar untuk produksi (tidak bisa dibingkai situs lain, tanpa sniffing tipe).
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default withSerwist(nextConfig);
