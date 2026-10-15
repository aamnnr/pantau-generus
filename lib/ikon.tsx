/**
 * Ikon aplikasi: bintang delapan (motif Islami, sama dengan dekorasi di blok hijau) putih
 * di atas hijau PPG dengan titik kunyit. Latar penuh agar aman untuk ikon "maskable".
 * `isi` = proporsi bintang terhadap kanvas (maskable butuh zona aman ±80%).
 */
export function GambarIkon({ ukuran, isi = 0.72 }: { ukuran: number; isi?: number }) {
  const s = ukuran * isi;
  return (
    <div style={{ width: ukuran, height: ukuran, display: "flex", alignItems: "center", justifyContent: "center", background: "#019147" }}>
      <svg width={s} height={s} viewBox="0 0 100 100" fill="none" stroke="#ffffff" strokeWidth="7" strokeLinejoin="round">
        <rect x="21" y="21" width="58" height="58" />
        <rect x="21" y="21" width="58" height="58" transform="rotate(45 50 50)" />
        <circle cx="50" cy="50" r="13" fill="#FF9822" stroke="none" />
      </svg>
    </div>
  );
}
