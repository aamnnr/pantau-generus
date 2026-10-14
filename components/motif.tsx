import { cn } from "@/lib/utils";

/** Motif geometris Islami tipis (bintang delapan) untuk blok hijau — dekorasi saja. */
export function Motif({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 100 100"
      className={cn("pointer-events-none absolute opacity-15", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <rect x="20" y="20" width="60" height="60" />
      <rect x="20" y="20" width="60" height="60" transform="rotate(45 50 50)" />
      <circle cx="50" cy="50" r="18" />
      <circle cx="50" cy="50" r="44" />
    </svg>
  );
}
