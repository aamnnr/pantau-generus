import { ImageResponse } from "next/og";
import { GambarIkon } from "@/lib/ikon";

// Ukuran ikon PWA (DESIGN §10): 192/512, maskable 512, dan ikon Apple 180.
const UKURAN = {
  "192.png": { px: 192, isi: 0.72 },
  "512.png": { px: 512, isi: 0.72 },
  "maskable-512.png": { px: 512, isi: 0.56 },
  "apple-180.png": { px: 180, isi: 0.64 },
} as const;

export function generateStaticParams() {
  return Object.keys(UKURAN).map((ukuran) => ({ ukuran }));
}

export async function GET(_req: Request, { params }: RouteContext<"/ikon/[ukuran]">) {
  const { ukuran } = await params;
  const u = UKURAN[ukuran as keyof typeof UKURAN];
  if (!u) return new Response(null, { status: 404 });
  return new ImageResponse(<GambarIkon ukuran={u.px} isi={u.isi} />, { width: u.px, height: u.px });
}
