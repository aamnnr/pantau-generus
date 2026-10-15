import Image from "next/image";
import { cn } from "@/lib/utils";

/** Logo aplikasi (berkas yang sama dengan ikon PWA, public/ikon/192.png). */
export function TandaLogo({ className }: { className?: string }) {
  return (
    <Image
      src="/ikon/192.png"
      alt=""
      aria-hidden
      width={40}
      height={40}
      unoptimized
      priority
      className={cn("size-10 shrink-0 rounded-xl", className)}
    />
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <TandaLogo />
      <span className="text-lg leading-tight font-bold tracking-tight">Pantau Generus</span>
    </span>
  );
}
