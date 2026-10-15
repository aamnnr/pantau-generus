import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // Lewati aset statis, service worker, manifest, ikon, dan halaman offline: harus termuat tanpa sesi.
    "/((?!_next/static|_next/image|favicon.ico|serwist/|~offline|manifest.webmanifest|ikon/|.*\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
