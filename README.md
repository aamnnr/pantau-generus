# Pantau Generus

Aplikasi web (PWA) untuk memantau **kehadiran, materi, dan capaian target generus** (Caberawit, Pra-remaja, Remaja) dalam satu kelompok pengajian. Dibuat untuk pengguna berusia 30–50 tahun: ringkas, mudah dibaca, dan bisa dipasang di layar utama HP.

## Fitur

| Area | Isi |
|---|---|
| **Beranda** | Pengajian yang perlu diisi hari ini, grafik kehadiran 7 hari (filter jenjang/kelas), anak yang perlu perhatian, capaian target berjalan |
| **Pengajian Hari Ini** | Kegiatan rutin muncul otomatis dari jadwal; langkah Materi → Kehadiran → Tilawati (Caberawit) → Selesai |
| **Presensi cepat** | Semua otomatis *Hadir*, ketuk anak yang tidak hadir (Terlambat/Izin/Sakit/Alpa) |
| **Materi** | Makna & bacaan Al-Qur'an (surat:ayat) dan Al-Hadist (halaman) untuk Pra-remaja & Remaja; butir materi per aspek PPG (Alim, Faqih, Akhlaqul Karimah, Mandiri) |
| **Target** | Target per periode dari tim kurikulum PPG untuk satu/beberapa kelas; salin dari periode sebelumnya; rentang usia untuk target Caberawit |
| **Progres anak** | Kehadiran, bacaan/makna anak vs kelasnya, materi terlewat + catat susulan, penilaian (Lancar/Paham/Terbiasa), Tilawati (+1/+2/+3, naik jilid) |
| **Rekap & Raport** | Per Bulan · Periode target · Semester · Keseluruhan; daftar perlu perhatian (kehadiran < 60%); raport per anak/kelas siap cetak & PDF; lembar presensi cetak |
| **Peran** | Admin, Guru (kelasnya), Pengurus (lihat & raport), Wali (anaknya sendiri) — dijaga Row Level Security di database |

Masuk memakai **No. HP + PIN** (tanpa OTP). Akun dibuat oleh admin.

## Teknologi

Next.js 16 (App Router, Turbopack, Cache Components) · React 19 · TypeScript · Tailwind CSS 4 + shadcn/ui · Supabase (Postgres, Auth, RLS) · Serwist (PWA) · zod · date-fns · Vitest · pgTAP · pnpm. Semua layanan memakai paket **gratis** (Vercel Hobby, Supabase Free, GitHub Actions).

## Dokumen acuan

| Dokumen | Isi |
|---|---|
| [PRD.md](PRD.md) | Apa yang dibangun: tujuan, peran & hak akses, aturan progres, tahapan rilis |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Bagaimana dibangun: model data, fungsi SQL, RLS, struktur folder, deploy & backup (§10) |
| [DESIGN.md](DESIGN.md) | Prinsip UI, warna & maknanya, tipografi, layar kunci, gerak & umpan balik |
| [CLAUDE.md](CLAUDE.md) | Konvensi kode & aturan kerja |

## Menjalankan secara lokal

Prasyarat: **Node.js 26**, **pnpm 12**, dan satu proyek **Supabase** (Free) untuk pengembangan. Tidak perlu Docker.

```bash
pnpm install
cp .env.example .env.local        # isi URL & kunci proyek Supabase dev
pnpm exec supabase login
pnpm exec supabase link --project-ref <ref-proyek-dev>
pnpm exec supabase db push --linked                     # terapkan semua migrasi
pnpm akun:buat --nama "Nama Admin" --hp 08xxxxxxxxxx --pin 123456 --peran admin --kelompok "Nama Kelompok"
pnpm exec supabase db query --linked -f supabase/data/kelas-awal.sql   # kelas baku TK–3B, Pra-remaja, Remaja
pnpm dev                          # http://localhost:3000
```

Di Supabase dev: matikan pendaftaran mandiri dan konfirmasi email (Authentication → Sign In / Providers).

### Variabel lingkungan

| Nama | Keterangan |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL proyek Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Kunci `sb_publishable_…` |
| `SUPABASE_SECRET_KEY` | Kunci `sb_secret_…` — **hanya server**, untuk manajemen akun |
| `AUTH_EMAIL_DOMAIN` | Domain email sintetis untuk login No. HP (mis. `pantau-generus.local`) |

## Perintah

| Perintah | Fungsi |
|---|---|
| `pnpm dev` | Server pengembangan |
| `pnpm build` / `pnpm start` | Build & jalankan versi produksi |
| `pnpm lint` · `pnpm typecheck` · `pnpm test` | ESLint · TypeScript · Vitest |
| `pnpm test:db` | Uji pgTAP (RLS & fungsi SQL) ke proyek dev, selalu di-rollback |
| `pnpm db:types` | Regenerasi `types/database.ts` dari skema dev |
| `pnpm akun:buat` / `pnpm akun:buat:produksi` | Buat akun pertama (dev / produksi) |

## Struktur singkat

```
app/            rute (App Router): beranda, hari-ini, kegiatan, generus, target, rekap, raport, kelola, …
features/       per domain: queries.ts (baca, Server Component), actions.ts (tulis, Server Action + zod), komponen
components/     komponen bersama (form, kartu, navigasi) + ui/ (shadcn)
lib/            format tanggal/label, periode, validasi zod, klien Supabase
supabase/       migrations/ (skema & fungsi SQL), tests/ (pgTAP), data/ (kelas baku)
```

Perhitungan progres, rekap, dan kehadiran dilakukan di **SQL** (view & fungsi `security_invoker`) agar satu sumber kebenaran dan RLS tetap berlaku.

## Deploy, backup & CI

- **Deploy**: Vercel (region `sin1`) + Supabase produksi. Langkah lengkap di [ARCHITECTURE.md §10](ARCHITECTURE.md).
- **CI** (`.github/workflows/ci.yml`): lint, typecheck, Vitest, dan pgTAP di setiap push/PR.
- **Backup** (`backup.yml`): mingguan, roles + skema + data dienkripsi GPG, disimpan sebagai artifact 90 hari. Cara memulihkan di ARCHITECTURE §10.
- **Keep-alive** (`keep-alive.yml`): ping harian agar proyek Supabase Free tidak dijeda.

Secret GitHub Actions: `SUPABASE_DB_URL`, `BACKUP_PASSPHRASE`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`.
