import { Suspense } from "react";
import { getSession } from "@/lib/auth/session";
import { BottomNav, Sidebar } from "./app-nav";
import { NAV_KELOLA, NAV_TAMBAHAN_DESKTOP, NAV_UTAMA, PERAN_KELOLA } from "./nav-config";

async function Navigasi() {
  const session = await getSession();
  const utama = NAV_UTAMA[session.mode];
  const kelola = PERAN_KELOLA.includes(session.mode) ? NAV_KELOLA : [];
  const desktop = [...utama, ...(NAV_TAMBAHAN_DESKTOP[session.mode] ?? [])];
  return (
    <>
      <Sidebar utama={desktop} kelola={kelola} nama={session.nama} mode={session.mode} />
      <BottomNav utama={utama} />
    </>
  );
}

/** Sidebar (≥1024px) + bottom nav (HP/tablet) — DESIGN §5.1. */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-1">
      <Suspense fallback={<div className="hidden w-72 shrink-0 bg-brand lg:block" />}>
        <Navigasi />
      </Suspense>
      <div className="min-w-0 flex-1 pb-24 lg:pb-0">{children}</div>
    </div>
  );
}
