# ARCHITECTURE — Sistem Pemantauan Target Generus

> Status: Draft v0.1 · 13 Okt 2026. Kebutuhan produk ada di [PRD.md](PRD.md).

## 1. Ringkasan Stack

| Lapisan | Teknologi | Alasan |
|---|---|---|
| Framework | **Next.js 16** (App Router, Turbopack, TypeScript strict) | Server Components + Server Actions, satu repo untuk UI & backend |
| UI | **Tailwind CSS 4** + **shadcn/ui** (Radix) | Komponen aksesibel, mudah diatur ukurannya |
| Form & validasi | **react-hook-form** + **zod 4** | Skema zod dipakai di client dan server |
| Database & Auth | **Supabase** (Postgres, Auth, RLS) | Gratis, hak akses ditegakkan di DB |
| Akses DB | `@supabase/ssr` + tipe hasil `supabase gen types` | Tanpa ORM; query tipe-aman |
| PWA | **Serwist** (`@serwist/turbopack`) | Manifest + service worker; kompatibel Turbopack; siap untuk mode offline nanti |
| Tanggal | **date-fns 4** + `@date-fns/tz`, locale `id` | Format Indonesia, zona Asia/Jakarta |
| Uji | **Vitest** (logika), **pgTAP** via `supabase test db` di CI (RLS & fungsi SQL), **Playwright** (alur utama) | |
| Package manager | **pnpm** | |
| Hosting | **Vercel** Hobby + **Supabase** Free | 100% gratis |
| CI/Backup | **GitHub Actions** | Lint/test, backup `pg_dump` mingguan, ping keep-alive |

### 1.1 Kebijakan Versi

Selalu memakai **versi stabil terbaru** saat instalasi; versi persis dikunci oleh `pnpm-lock.yaml`. Acuan saat dokumen ditulis (13 Okt 2026):

| Paket | Versi |
|---|---|
| Node.js | 26.x |
| pnpm | 12.x |
| TypeScript | 6.x (TS 7 belum didukung typescript-eslint; naikkan bila sudah) |
| next | 16.4 |
| react / react-dom | 19.3 |
| tailwindcss | 4.3 |
| shadcn (CLI) | 4.21 |
| @supabase/supabase-js | 2.117 |
| @supabase/ssr | 0.12 |
| supabase (CLI) | 2.120 |
| @serwist/turbopack | 9.5 |
| zod | 4.6 |
| react-hook-form | 7.90 |
| date-fns / @date-fns/tz | 4.4 / 1.5 |
| vitest | 5.0 |
| @playwright/test | 1.64 |

Catatan Next.js 16: `middleware.ts` kini bernama **`proxy.ts`**.

## 2. Gambaran Sistem

```
┌──────────────── HP / Laptop (PWA) ────────────────┐
│ Next.js client components (form, presensi cepat)  │
└───────────────┬───────────────────────────────────┘
                │ HTTPS
┌───────────────▼─────────── Vercel ────────────────┐
│ Next.js Server Components  → baca data            │
│ Server Actions             → tulis data (zod)     │
│ Proxy (proxy.ts)           → refresh sesi, guard  │
│ Admin actions (service_role, server-only)         │
│   → buat akun / reset PIN                         │
└───────────────┬───────────────────────────────────┘
                │ supabase-js (JWT pengguna)
┌───────────────▼─────────── Supabase ──────────────┐
│ Auth (email sintetis + password=PIN)              │
│ Postgres: tabel + RLS + view/fungsi progres       │
└───────────────────────────────────────────────────┘
```

**Prinsip:**
- Semua baca/tulis memakai **JWT pengguna** sehingga RLS selalu berlaku.
- `service_role` key **hanya** dipakai di modul `server-only` untuk manajemen akun (buat/reset/hapus). Tidak pernah diekspos ke client.
- Logika perhitungan progres berada di **SQL (view/fungsi)** agar konsisten antara halaman, raport, dan rekap.

## 3. Autentikasi No. HP + PIN

Supabase phone auth membutuhkan SMS berbayar, sehingga dipakai **email sintetis**:

1. Normalisasi nomor: hapus non-digit; `0…` → `62…`; `+62…` → `62…`.
2. Email = `{nomor_normal}@{AUTH_EMAIL_DOMAIN}` (mis. `6281234567890@pantau-generus.local`).
3. Password = PIN (6 digit, minimal panjang password Supabase).
4. Konfirmasi email dimatikan; akun dibuat admin via `auth.admin.createUser` (`email_confirm: true`).
5. Pendaftaran mandiri dimatikan di pengaturan Supabase Auth.
6. Rate limit login bawaan Supabase dipertahankan untuk mengurangi tebak-PIN.

## 4. Model Data

Konvensi: nama tabel/kolom **snake_case**, istilah domain Bahasa Indonesia (lihat Glosarium di [CLAUDE.md](CLAUDE.md)). Semua tabel memiliki `id uuid`, `created_at`, `updated_at`, dan `kelompok_id` (persiapan multi-kelompok).

### 4.1 Organisasi & Pengguna

| Tabel | Kolom penting | Catatan |
|---|---|---|
| `kelompok` | `nama` | Untuk sekarang hanya 1 baris |
| `profil` | `id → auth.users`, `nama`, `no_hp` (unik) | Satu per akun |
| `profil_peran` | `profil_id`, `peran` (`admin`\|`guru`\|`pengurus`\|`wali`) | Satu orang bisa banyak peran |

### 4.2 Struktur Kelas & Generus

| Tabel | Kolom penting | Catatan |
|---|---|---|
| `kelas` | `jenjang` (enum `caberawit`\|`pra_remaja`\|`remaja`), `nama`, `urutan`, `aktif` | Dikelola admin |
| `generus` | `nama`, `jenis_kelamin`, `tanggal_lahir`, `kelas_id`, `status` (`aktif`\|`lulus`\|`pindah`\|`nonaktif`) | `kelas_id` = kelas saat ini |
| `riwayat_kelas` | `generus_id`, `kelas_id`, `mulai`, `selesai` | Diisi via trigger saat `kelas_id` berubah |
| `generus_wali` | `generus_id`, `profil_id`, `hubungan` | Many-to-many |
| `guru` | `nama`, `no_hp`, `profil_id` (nullable) | Guru tanpa akun tetap tercatat |
| `guru_kelas` | `guru_id`, `kelas_id` | Many-to-many |

### 4.3 Materi

| Tabel | Kolom penting | Catatan |
|---|---|---|
| `kitab` | `nama`, `jenis` (`quran`\|`hadist`), `satuan` (`halaman`\|`ayat`), `total_satuan` | Al-Qur'an = 1 baris tetap (`satuan='ayat'`, `total_satuan=6236`) |
| `quran_surat` | `nomor` (1–114, PK), `nama_latin`, `nama_arab`, `jumlah_ayat`, `ayat_awal` (nomor ayat global pertama) | Data referensi global (tanpa `kelompok_id`), di-seed via migrasi, read-only |
| `materi_item` | `aspek` (`alim`\|`faqih`\|`akhlaqul_karimah`\|`mandiri`), `mapel` (teks: Hafalan, Kefahaman Agama, Praktek Ibadah, Akhlaq, Tata Krama, Kemandirian, …), `nama`, `keterangan`, `jenjang` (nullable), `jenis_kelamin` (nullable = semua) | Mengikuti format kurikulum PPG. Unik (`aspek`, `mapel`, `nama`) |

### 4.4 Jadwal, Kegiatan & Presensi

| Tabel | Kolom penting | Catatan |
|---|---|---|
| `jadwal_rutin` | `hari` (1=Senin…7=Minggu), `jam_mulai`, `jam_selesai`, `guru_id` default, `aktif` | |
| `jadwal_rutin_kelas` | `jadwal_rutin_id`, `kelas_id` | ≥1 kelas; >1 = jadwal gabungan |
| `kegiatan` | `jadwal_rutin_id` (nullable), `tanggal`, `jam_mulai`, `jam_selesai`, `judul`, `jenis` (`rutin`\|`khusus`), `status` (`terjadwal`\|`selesai`\|`batal`), `catatan`, `diinput_oleh` | Unik (`jadwal_rutin_id`, `tanggal`) |
| `kegiatan_kelas` | `kegiatan_id`, `kelas_id` | ≥1 kelas; >1 = **kegiatan gabungan**. Peserta = generus aktif semua kelas ini |
| `kegiatan_pengajar` | `kegiatan_id`, `guru_id` | ≥1 pengajar |
| `kegiatan_rundown` | `kegiatan_id`, `urutan`, `waktu`, `aktivitas` | |
| `kegiatan_materi` | `kegiatan_id`, `kitab_id`, `jenis` (`makna`\|`bacaan`), `mulai`, `selesai` | Satuan mengikuti `kitab.satuan` (lihat §4.6). `bacaan` hanya untuk Al-Qur'an. `CHECK (mulai <= selesai)` |
| `presensi` | `kegiatan_id`, `generus_id`, `status` (`hadir`\|`terlambat`\|`izin`\|`sakit`\|`alpa`), `keterangan`, `diubah_oleh` | Unik (`kegiatan_id`, `generus_id`) |
| `susulan` | `generus_id`, `kitab_id`, `jenis` (`makna`\|`bacaan`), `mulai`, `selesai`, `tanggal`, `guru_id` | Menambah progres anak |

**Pembuatan kegiatan rutin:** tidak memakai cron. Saat halaman "Pengajian Hari Ini" (atau daftar kegiatan suatu tanggal) dibuka, fungsi SQL `siapkan_kegiatan(tanggal)` melakukan `INSERT … ON CONFLICT DO NOTHING` dari `jadwal_rutin` yang cocok. Idempoten dan gratis.

### 4.5 Penilaian & Target

| Tabel | Kolom penting | Catatan |
|---|---|---|
| `penilaian` | `generus_id`, `materi_item_id`, `status` (`belum`\|`proses`\|`lancar`), `tanggal`, `dinilai_oleh` | Append-only; status terakhir berlaku. Label tampilan per aspek (DESIGN §3) |
| `jilid_tilawati` | `jilid`, `total_halaman` | Diatur admin |
| `capaian_tilawati` | `generus_id`, `jenis` (`tambah`\|`koreksi`\|`naik_jilid`), `tambahan` (int, untuk `tambah`), `jilid`, `halaman` (posisi **setelah** entri), `kegiatan_id` (nullable), `tanggal`, `dinilai_oleh` | Append-only; entri terakhir = posisi saat ini. Tombol +N membuat entri `tambah` |
| `target_bulanan` | `judul` (mis. "Periode Bulan Oktober"), `semester`, `mulai`, `selesai` (date), `catatan` | Periode dari lembaga atas, tidak harus bulan kalender (mis. 5 Okt – 7 Nov) |
| `target_bulanan_kelas` | `target_bulanan_id`, `kelas_id` | ≥1 kelas per target. Periode target satu kelas tidak boleh bertumpukan (trigger) |
| `target_kitab` | `target_bulanan_id`, `kitab_id`, `jenis` (`makna`\|`bacaan`), `mulai`, `selesai` | Makna Al-Qur'an/Al-Hadist dan bacaan Al-Qur'an |
| `target_materi` | `target_bulanan_id`, `materi_item_id` | Materi item semua aspek (Alim/Faqih/Akhlaqul Karimah/Mandiri) |
| `target_tilawati` | `target_bulanan_id`, `jilid`, `halaman` | |
| `catatan_raport` | `generus_id`, `bulan`, `catatan`, `ditulis_oleh` | |
| `pengaturan` | `kelompok_id`, `ambang_kehadiran` (default 60) | |

### 4.6 Satuan Makna: Halaman vs Ayat Global

Agar Al-Hadist dan Al-Qur'an memakai logika yang sama, setiap rentang disimpan sebagai **dua bilangan bulat** `mulai`–`selesai`:

| Kitab | Arti `mulai`/`selesai` | Contoh tersimpan | Tampilan |
|---|---|---|---|
| Al-Hadist (`satuan='halaman'`) | Nomor halaman | `15–20` | hal. 15–20 |
| Al-Qur'an (`satuan='ayat'`) | **Nomor ayat global** 1–6236 | `8–27` | Al-Baqarah 1–20 |

Konversi dilakukan di SQL, bukan di client:
- `fn_ayat_global(surat, ayat) → int` = `quran_surat.ayat_awal + ayat − 1` (validasi `ayat ≤ jumlah_ayat`).
- `fn_surat_ayat(global) → (surat, ayat)` untuk tampilan.
- `fn_format_rentang(kitab_id, mulai, selesai) → text` mis. `Al-Baqarah 280 – Ali 'Imran 10`.

Rentang lintas surat otomatis didukung karena nomor global berurutan.

## 5. Perhitungan Progres (SQL)

Inti perhitungan: himpunan **satuan unik** (halaman atau ayat global), dihitung **terpisah per `jenis`** (`makna` dan `bacaan`) — bacaan Al-Qur'an Remaja memakai logika yang sama dengan makna, hanya beda jenis.

```sql
-- satuan yang diikuti anak (hadir/terlambat + susulan)
select p.generus_id, km.kitab_id, u.satuan
from presensi p
join kegiatan k        on k.id = p.kegiatan_id and k.status <> 'batal'
join kegiatan_materi km on km.kegiatan_id = k.id
cross join lateral generate_series(km.mulai, km.selesai) as u(satuan)
where p.status in ('hadir', 'terlambat')
union
select s.generus_id, s.kitab_id, u.satuan
from susulan s
cross join lateral generate_series(s.mulai, s.selesai) as u(satuan);
```

Dibungkus menjadi:
- `v_satuan_diikuti(generus_id, kitab_id, satuan)` — dasar progres anak.
- `v_satuan_disampaikan(kelas_id, kitab_id, satuan)` — dasar progres kelas; join lewat `kegiatan_kelas` sehingga materi kegiatan gabungan terhitung untuk **setiap** kelas peserta.
- `fn_progres_makna(generus_id, kitab_id, dari, sampai)` — % terhadap seluruh kitab atau rentang target.
- `fn_progres_quran_per_surat(generus_id)` — % per surat (join ke `quran_surat` dengan `satuan between ayat_awal and ayat_awal + jumlah_ayat − 1`).
- `fn_materi_terlewat(generus_id, kitab_id)` — satuan disampaikan tetapi tidak diikuti, diringkas menjadi rentang (gaps-and-islands) lalu diformat dengan `fn_format_rentang`.
- `fn_rekap_presensi(generus_id, dari, sampai)`.

View dibuat `security_invoker = true` agar RLS tabel sumber tetap berlaku.

Volume diperkirakan kecil (±30 rb baris presensi/tahun), sehingga perhitungan langsung tanpa tabel ringkasan sudah cukup. Materialisasi baru dipertimbangkan bila terbukti lambat.

## 6. Hak Akses (RLS)

Fungsi pembantu (`security definer`, `stable`):

| Fungsi | Arti |
|---|---|
| `punya_peran(peran)` | Pengguna saat ini memiliki peran tsb. |
| `guru_mengajar_kelas(kelas_id)` | Pengguna adalah guru di kelas tsb. |
| `guru_mengajar_kegiatan(kegiatan_id)` | Pengguna adalah guru di **minimal satu** kelas kegiatan tsb. (kegiatan gabungan) |
| `wali_dari(generus_id)` | Pengguna adalah wali generus tsb. |

Pola kebijakan:

| Data | SELECT | INSERT/UPDATE/DELETE |
|---|---|---|
| Master data (kelas, kitab, materi_item, guru, jadwal) | semua pengguna masuk | admin |
| `generus` | admin, pengurus; guru (kelasnya); wali (anaknya) | admin |
| `kegiatan*`, `presensi`, `susulan` | admin, pengurus; guru (kelasnya); wali (kegiatan kelas anaknya / yang ada presensi anaknya) | admin; guru (kelasnya) |
| `penilaian`, `capaian_tilawati` | admin, pengurus; guru (kelasnya); wali (anaknya) | admin; guru (kelasnya) |
| `target_*` | semua pengguna masuk | admin |
| `catatan_raport` | admin, pengurus; guru (kelasnya); wali (anaknya) | admin, pengurus, guru (kelasnya) |
| `profil`, `profil_peran` | diri sendiri; admin & pengurus semua (PRD §4: pengurus melihat data wali & akun) | admin (via service_role) |
| `pengaturan` | semua pengguna masuk | admin, pengurus (ambang kehadiran) |

**Setiap tabel baru wajib** `enable row level security` + kebijakan + uji pgTAP.

## 7. Struktur Folder

```
.
├── app/
│   ├── (auth)/masuk/                 # halaman login
│   ├── (app)/                        # layout terautentikasi + navigasi per peran
│   │   ├── beranda/                  # dashboard sesuai peran
│   │   ├── hari-ini/                 # Pengajian Hari Ini
│   │   ├── kegiatan/[id]/            # detail, materi, rundown, presensi
│   │   ├── generus/              # daftar (+naik kelas massal), baru/, [id]/ubah/; [id]/ = progres anak (Tahap 5)
│   │   ├── target/                   # target bulanan
│   │   ├── raport/                   # raport anak & rekap
│   │   ├── lainnya/                 # profil, ganti mode, keluar, menu kelola
│   │   └── kelola/                   # master data: kelas, guru, akun (& wali), kitab, materi, tilawati — admin ubah, pengurus lihat
│   ├── manifest.ts
│   └── sw.ts                         # service worker (Serwist)
├── components/
│   ├── ui/                           # shadcn/ui
│   └── …                             # komponen domain
├── lib/
│   ├── supabase/{server,client,admin}.ts   # admin.ts = server-only, service_role
│   ├── auth/phone.ts                 # normalisasi no. HP
│   ├── validation/                   # skema zod
│   └── format.ts                     # tanggal, persen (locale id)
├── features/<domain>/                # actions.ts, queries.ts, komponen khusus domain
├── supabase/
│   ├── migrations/                   # SQL berurutan, tidak diubah setelah diterapkan
│   ├── tests/                        # pgTAP
│   └── seed.sql                      # data contoh pengembangan
├── types/database.ts                 # hasil supabase gen types
└── e2e/                              # Playwright
```

## 8. Alur Data Penting

**Presensi cepat**
1. Server Component memuat kegiatan + daftar generus aktif dari **semua kelas di `kegiatan_kelas`** + presensi yang ada.
2. Client menampilkan semua `hadir` secara default (jika belum ada presensi).
3. Simpan → Server Action → zod → `upsert` ke `presensi` (`on conflict (kegiatan_id, generus_id)`).
4. `revalidatePath` halaman terkait.

**Buat akun**
1. Admin isi nama, no. HP, peran, PIN awal.
2. Server Action memeriksa peran admin → `admin.createUser` (service_role) → insert `profil` + `profil_peran` dalam satu alur; rollback hapus user jika gagal.

## 9. Lingkungan & Konfigurasi

| Variabel | Lokasi | Keterangan |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | client+server | |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | client+server | Kunci `sb_publishable_…` (pengganti anon key) |
| `SUPABASE_SECRET_KEY` | **server saja** | Kunci `sb_secret_…` (pengganti service_role); manajemen akun |
| `AUTH_EMAIL_DOMAIN` | server | Domain email sintetis |

Pengembangan **tanpa Docker**: memakai dua proyek Supabase Free di cloud.

| Proyek | Kegunaan |
|---|---|
| `pantau-generus-dev` | Pengembangan & data contoh (`seed.sql`); boleh di-reset kapan saja |
| `pantau-generus` | Produksi; hanya menerima migrasi lewat `db push`, **tidak pernah** di-reset |

- Supabase CLI dipasang sebagai devDependency (`pnpm exec supabase`), di-`link` ke proyek **dev**.
- Uji pgTAP: **lokal** lewat `pnpm test:db` (`scripts/test-db.mjs`) — tiap file dijalankan ke proyek dev dalam satu transaksi yang selalu di-rollback, hasil TAP dikembalikan lewat exception; **CI** lewat GitHub Actions (`supabase db start` + `supabase test db`, runner sudah punya Docker).
- Konvensi file uji: assertion `select …;` di kolom 0, data bersama di `supabase/tests/_setup.psql` (di-include dengan `\ir`).
- Akun pertama dibuat dengan `pnpm akun:buat` (secret key); akun berikutnya dari aplikasi.

## 10. Operasional (Gratis)

| Kebutuhan | Solusi |
|---|---|
| Deploy | Vercel terhubung ke GitHub (preview per PR) |
| Migrasi produksi | `supabase db push` dari CI/manual |
| Backup | GitHub Action mingguan: `pg_dump` → artifact terenkripsi |
| Supabase pause (7 hari tidak aktif) | GitHub Action ping harian |

## 11. Keputusan Arsitektur (ADR singkat)

| # | Keputusan | Alternatif ditolak | Alasan |
|---|---|---|---|
| 1 | PWA, bukan native | React Native/Flutter | Tanpa Play Store, update otomatis, ringan, satu kode |
| 2 | Supabase + RLS | Cloudflare D1, Firebase | Postgres relasional, RLS untuk wali/guru, gratis |
| 3 | Tanpa ORM | Prisma/Drizzle | RLS butuh JWT pengguna; supabase-js + tipe hasil generate cukup |
| 4 | Email sintetis untuk No. HP | Phone OTP | OTP SMS berbayar |
| 5 | Progres dihitung di SQL | Hitung di JS | Satu sumber kebenaran untuk halaman, raport, rekap |
| 6 | Kegiatan rutin dibuat on-demand | Cron | Gratis, idempoten, tanpa infrastruktur tambahan |
| 7 | `kelompok_id` di semua tabel | Single-tenant murni | Ekspansi ke desa/daerah tanpa migrasi besar |
| 8 | Relasi kegiatan↔kelas many-to-many (`kegiatan_kelas`) | Satu `kelas_id` per kegiatan | Mendukung kegiatan gabungan; progres tiap kelas tetap terhitung |
| 9 | Tilawati sebagai log append-only (+N / koreksi / naik jilid) | Satu kolom posisi yang ditimpa | Riwayat lengkap untuk raport; input +N cepat; koreksi tetap bisa |
| 10 | Al-Qur'an diukur per **ayat global** (1–6236), Al-Hadist per halaman, keduanya sebagai rentang integer | Halaman mushaf; kolom terpisah surat/ayat | Halaman mushaf berbeda antar cetakan; integer membuat logika progres seragam & lintas surat mudah |
| 11 | Dev memakai proyek Supabase cloud terpisah; pgTAP di CI | Supabase lokal (Docker) | Laptop pengembang tanpa Docker; tetap gratis; produksi terpisah dari data uji |
| 12 | Struktur materi mengikuti kurikulum PPG: `aspek` + `mapel` teks; target berperiode untuk ≥1 kelas; rentang kitab `makna`/`bacaan` | Hafalan/praktik saja; target per kelas per bulan kalender | Dokumen target lembaga atas memakai Aspek→Mapel, periode lintas bulan (5 Okt–7 Nov), dan satu dokumen per jenjang |
