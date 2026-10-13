import type { Metadata } from "next";
import { MasukForm } from "@/features/auth/masuk-form";

export const metadata: Metadata = { title: "Masuk · Pantau Generus" };

export default function MasukPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10 md:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Pantau Generus</h1>
        <p className="mt-1 text-muted-foreground">Silakan masuk dengan No. HP dan PIN.</p>
      </div>
      <MasukForm />
    </main>
  );
}
