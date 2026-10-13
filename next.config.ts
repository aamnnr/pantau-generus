import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  // Tidak ada halaman di "/" — pengalihan di config agar tidak terjadi saat prerender.
  async redirects() {
    return [{ source: "/", destination: "/beranda", permanent: false }];
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
