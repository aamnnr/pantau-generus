import { Suspense } from "react";
import { getSession } from "@/lib/auth/session";
import { BottomNav, Sidebar } from "./app-nav";
import { NAV_KELOLA, NAV_SIDEBAR, NAV_UTAMA } from "./nav-config";

async function Navigasi() {
  const session = await getSession();
  const utama = NAV_UTAMA[session.mode];
  const kelola = NAV_KELOLA[session.mode];
  const desktop = NAV_SIDEBAR[session.mode];
  return (
    // Navigasi tidak ikut tercetak (raport, lembar presensi — DESIGN §7.7).
    <div className="contents print:hidden">
      <Sidebar utama={desktop} kelola={kelola} nama={session.nama} mode={session.mode} />
      <BottomNav utama={utama} />
    </div>
  );
}

/** Sidebar (≥1024px) + bottom nav (HP/tablet) — DESIGN §5.1. */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-1">
      <Suspense fallback={<div className="hidden w-64 shrink-0 border-r bg-card lg:block" />}>
        <Navigasi />
      </Suspense>
      <div className="min-w-0 flex-1 pb-20 lg:pb-0 print:pb-0">{children}</div>
    </div>
  );
}
