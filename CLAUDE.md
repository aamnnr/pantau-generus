# CLAUDE.md

Aplikasi PWA untuk memantau kehadiran, materi, dan capaian target generus (Caberawit, Pra-remaja, Remaja) di satu kelompok pengajian. Pengguna utama berusia 30–50 tahun.

## Dokumen Acuan — baca sebelum mengerjakan fitur

- [PRD.md](PRD.md): scope, peran, aturan progres, tahapan. **Sumber kebenaran untuk "apa"**.
- [ARCHITECTURE.md](ARCHITECTURE.md): stack, model data, RLS, struktur folder. **Sumber kebenaran untuk "bagaimana"**.
- [DESIGN.md](DESIGN.md): prinsip UI, token, pola komponen, gaya bahasa.

Jika implementasi harus menyimpang dari dokumen di atas, **tanyakan dulu**, lalu perbarui dokumennya dalam perubahan yang sama.

## Batasan Scope

- Kerjakan hanya yang ada di PRD dan tahap yang sedang berjalan (§8 PRD). Ide di luar scope → usulkan ke pengguna, jangan langsung dibangun.
- Non-goals versi pertama (PRD §3): multi-kelompok, offline, notifikasi, keuangan, native app, ranking, OTP.
- Semua layanan harus **gratis** (Vercel Hobby, Supabase Free, GitHub Actions). Jangan menambah layanan/dependensi berbayar.
- Tambah dependensi baru hanya bila jelas perlu; sebutkan alasannya.

## Stack

Next.js 16 (App Router, Turbopack, TS strict) · React 19 · Tailwind 4 + shadcn/ui · react-hook-form + zod 4 · Supabase (Postgres, Auth, RLS) via `@supabase/ssr` · Serwist (`@serwist/turbopack`) · date-fns 4 + `@date-fns/tz` (locale `id`, zona Asia/Jakarta) · Vitest · pgTAP · Playwright · pnpm.

Selalu gunakan **versi stabil terbaru** dan API terkininya (mis. Next.js 16: `proxy.ts`, bukan `middleware.ts`). Jika ragu dengan API suatu versi, cek dokumentasi resminya dulu, jangan mengandalkan ingatan. Acuan versi: ARCHITECTURE.md §1.1.

## Perintah

```bash
pnpm dev              # jalankan Next.js
pnpm lint             # ESLint
pnpm typecheck        # tsc --noEmit
pnpm test             # Vitest
pnpm test:e2e         # Playwright
# Supabase: tanpa Docker, CLI di-link ke proyek DEV (ARCHITECTURE §9)
pnpm exec supabase db push --linked     # terapkan migrasi baru ke dev
pnpm exec supabase db reset --linked    # reset dev + seed — JANGAN ke produksi
pnpm db:types         # regenerasi types/database.ts dari dev
pnpm test:db          # uji pgTAP ke dev (selalu di-rollback); juga jalan di CI
pnpm akun:buat --nama "…" --hp 08… --pin 123456 --peran admin [--kelompok "…"]
```

## Konvensi Kode

- **Bahasa:** istilah domain memakai Bahasa Indonesia apa adanya (lihat Glosarium) di nama tabel, kolom, tipe, dan rute. Kode teknis umum memakai Bahasa Inggris (`getProgress`, `useToast`). Contoh: `presensi.status`, `fetchKegiatanHariIni()`, rute `/kegiatan/[id]`.
- **Teks UI** selalu Bahasa Indonesia sesuai DESIGN.md §8. Jangan menulis teks UI dalam Bahasa Inggris.
- Baca data di **Server Components**; tulis data lewat **Server Actions** di `features/<domain>/actions.ts`, divalidasi zod.
- Semua akses DB memakai klien dengan **JWT pengguna** agar RLS berlaku. `lib/supabase/admin.ts` (service_role) hanya untuk manajemen akun dan wajib `import "server-only"`.
- Perhitungan progres/rekap ada di **SQL** (view/fungsi), bukan diduplikasi di TypeScript.
- Tanggal disimpan sebagai `date`/`time` lokal WIB; format tampilan lewat `lib/format.ts`.
- Komentar seperlunya; jelaskan *mengapa*, bukan *apa*.

## Aturan Database

- Perubahan skema **hanya** lewat file baru di `supabase/migrations/`. Jangan mengubah migrasi yang sudah diterapkan.
- Setiap tabel baru: `kelompok_id`, `created_at`, `updated_at`, **RLS aktif**, kebijakan sesuai matriks ARCHITECTURE §6, dan **uji pgTAP** untuk tiap peran.
- View memakai `security_invoker = true`.
- Setelah migrasi: regenerasi `types/database.ts`.

## Aturan UI

- Ikuti DESIGN.md: teks dasar 15px, minimum 13px; tombol utama 44px, target sentuh ≥ 40px; kartu putih bergaris tipis tanpa blok warna; status tidak hanya dengan warna; gerak halus & umpan balik sesuai §11 (hormati `prefers-reduced-motion`).
- Pilihan ≤ 5 opsi → tombol segmen, bukan dropdown.
- Responsif penuh (DESIGN.md §5.1): uji setiap layar di lebar **360px, 768px, dan 1280px**. Mobile = kartu + bottom nav; desktop = sidebar + tabel.

## Definisi Selesai

1. `pnpm lint`, `pnpm typecheck`, `pnpm test` lulus; `pnpm test:db` lulus bila ada perubahan SQL (dan job pgTAP di CI).
2. Alur utama dicoba di browser (lebar mobile) — bukan hanya lewat tes.
3. Dokumen terkait (PRD/ARCHITECTURE/DESIGN, status tahap di PRD §8) diperbarui bila berubah.

## Glosarium

| Istilah | Arti |
|---|---|
| Generus | Anak/remaja binaan |
| Jenjang | Caberawit, Pra-remaja (usia SMP), Remaja |
| Kelas | Pembagian dalam jenjang (Caberawit: TK, 1A, 1B, 2A, 2B, 3A, 3B; Pra-remaja; Remaja: Usia sekolah (SLTA), Usia mandiri) |
| Kegiatan | Satu sesi pengajian (tanggal, kelas, rundown, materi) |
| Kegiatan gabungan | Kegiatan untuk lebih dari satu kelas sekaligus |
| Jadwal rutin | Pola kegiatan mingguan per kelas |
| Presensi | Kehadiran: hadir, terlambat, izin, sakit, alpa |
| Kitab | Sumber materi makna (Al-Qur'an / Al-Hadist) |
| Makna | Materi pemaknaan; progres Al-Hadist per **halaman**, Al-Qur'an per **ayat** (disimpan sebagai nomor ayat global 1–6236, ditampilkan surat:ayat) |
| Satuan | Unit progres makna: halaman atau ayat; kolom rentang selalu `mulai`/`selesai` |
| Materi item | Butir materi yang dinilai per anak, dikelompokkan **Aspek → Mapel** (format PPG): hafalan, kefahaman, praktek ibadah, akhlaq, tata krama, kemandirian |
| Aspek | Kelompok besar kurikulum PPG: Alim, Faqih, Akhlaqul Karimah, Mandiri |
| Bacaan | Membaca Al-Qur'an (mis. Remaja Juz 3); dicatat sebagai rentang ayat seperti makna, tetapi terpisah |
| Tilawati | Metode baca Al-Qur'an Caberawit; dicatat per anak (jilid + halaman, input +N) |
| Susulan | Mengejar materi yang terlewat karena tidak hadir |
| Target bulanan | Target materi dari lembaga atas per **periode** (mis. 5 Okt – 7 Nov), berlaku untuk ≥1 kelas |
| Wali | Orang tua/wali generus |
| Pengurus | Pengurus kelompok yang memantau semua progres dan membuat raport |
