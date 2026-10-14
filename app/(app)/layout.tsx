import { Suspense } from "react";
import { AppShell } from "@/components/app-shell/app-shell";
import { FlashToaster } from "@/components/flash-toaster";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <AppShell>
      {children}
      <Suspense fallback={null}>
        <FlashToaster />
      </Suspense>
    </AppShell>
  );
}
