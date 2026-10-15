"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Cetak / simpan PDF lewat dialog cetak peramban (tanpa layanan tambahan). */
export function TombolCetak({ label = "Cetak / Simpan PDF" }: { label?: string }) {
  return (
    <Button type="button" size="lg" onClick={() => window.print()} className="print:hidden">
      <Printer aria-hidden />
      {label}
    </Button>
  );
}
