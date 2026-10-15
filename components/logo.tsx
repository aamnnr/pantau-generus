import { cn } from "@/lib/utils";

/** Tanda aplikasi: bintang delapan putih di atas teal (sama dengan ikon PWA). */
export function TandaLogo({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(145deg,#17a39e,#0d807c_60%,#0b6b68)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_2px_6px_rgba(13,128,124,0.25)]",
        className,
      )}
    >
      <svg viewBox="0 0 100 100" className="size-[62%]" fill="none" stroke="currentColor" strokeWidth="8" strokeLinejoin="round">
        <rect x="21" y="21" width="58" height="58" />
        <rect x="21" y="21" width="58" height="58" transform="rotate(45 50 50)" />
        <circle cx="50" cy="50" r="11" fill="currentColor" stroke="none" />
      </svg>
    </span>
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
