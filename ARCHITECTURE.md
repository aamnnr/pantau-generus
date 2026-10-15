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
| `kegiatan_materi` | `kegiatan_id`, `kitab_id`, `jenis` (`makna`\|`bacaan`), `mulai`, `selesai`, `urutan` | Satuan mengikuti `kitab.satuan` (lihat §4.6). `bacaan` hanya untuk Al-Qur'an. `CHECK (mulai <= selesai)` |
| `kegiatan_materi_item` | `kegiatan_id`, `materi_item_id` | Butir materi item yang disampaikan ke seluruh peserta; anak hadir/terlambat = sudah menerima. Disimpan via `simpan_materi_item_kegiatan`; `materi_item_target_kegiatan()` memberi butir target periode yang berlaku |
| `presensi` | `kegiatan_id`, `generus_id`, `status` (`hadir`\|`terlambat`\|`izin`\|`sakit`\|`alpa`), `keterangan`, `diubah_oleh` | Unik (`kegiatan_id`, `generus_id`) |
| `susulan` | `generus_id`, `kitab_id`, `jenis` (`makna`\|`bacaan`), `mulai`, `selesai`, `tanggal`, `guru_id` | Menambah progres anak |

**Pembuatan kegiatan rutin:** tidak memakai cron. Saat halaman "Pengajian Hari Ini" (atau daftar kegiatan suatu tanggal) dibuka, fungsi SQL `siapkan_kegiatan(tanggal)` melakukan `INSERT … ON CONFLICT DO NOTHING` dari `jadwal_rutin` yang cocok. Idempoten dan gratis.

**Pendukung layar kegiatan (Tahap 3):**
- `v_kegiatan_ringkas` (security_invoker): kelas (jsonb), pengajar, jumlah presensi & materi — kartu Hari Ini/Riwayat.
- `v_kegiatan_materi` (security_invoker): materi + `teks` (`fn_format_rentang`) + surat:ayat untuk diedit.
- `simpan_materi_kegiatan(kegiatan_id, baris jsonb)` & `simpan_rundown(kegiatan_id, baris jsonb)`: ganti seluruh baris secara atomik; Al-Qur'an dikirim sebagai surat:ayat dan dikonversi ke ayat global di SQL. Fungsi invoker, dicek `boleh_kelola_kegiatan`, RLS tetap berlaku.
- Presensi disimpan dengan upsert `(kegiatan_id, generus_id)`; peserta = generus aktif semua kelas kegiatan + anak yang sudah punya presensi.

### 4.5 Penilaian & Target

| Tabel | Kolom penting | Catatan |
|---|---|---|
| `penilaian` | `generus_id`, `materi_item_id`, `status` (`belum`\|`proses`\|`lancar`), `tanggal`, `dinilai_oleh` | Append-only; status terakhir berlaku. Label tampilan per aspek (DESIGN §3) |
| `jilid_tilawati` | `jilid`, `total_halaman` | Diatur admin |
| `capaian_tilawati` | `generus_id`, `jenis` (`tambah`\|`koreksi`\|`naik_jilid`), `tambahan` (int, untuk `tambah`), `jilid`, `halaman` (posisi **setelah** entri), `kegiatan_id` (nullable), `tanggal`, `dinilai_oleh`, `no_urut` (identity) | Append-only; entri yang terakhir **dicatat** (`no_urut`, bukan `tanggal`) = posisi saat ini. Tombol +N membuat entri `tambah`; Urungkan = entri `koreksi` |
| `target_bulanan` | `judul` (mis. "Periode Bulan Oktober"), `semester`, `mulai`, `selesai` (date), `catatan`, `dibuat_oleh` | Periode dari lembaga atas, tidak harus bulan kalender (mis. 5 Okt – 7 Nov) |
| `target_bulanan_kelas` | `target_bulanan_id`, `kelas_id` | ≥1 kelas per target. Periode target satu kelas tidak boleh bertumpukan (trigger) |
| `target_kitab` | `target_bulanan_id`, `kitab_id`, `jenis` (`makna`\|`bacaan`), `mulai`, `selesai`, `urutan` | Makna Al-Qur'an/Al-Hadist dan bacaan Al-Qur'an |
| `target_materi` | `target_bulanan_id`, `materi_item_id` | Materi item semua aspek (Alim/Faqih/Akhlaqul Karimah/Mandiri) |
| `target_tilawati` | `target_bulanan_id`, `jilid`, `halaman` | |
| `catatan_raport` | `generus_id`, `bulan`, `catatan`, `ditulis_oleh` | |
| `pengaturan` | `kelompok_id`, `ambang_kehadiran` (default 60) | |

**Pendukung layar target (Tahap 4):**
- `v_target_ringkas` (security_invoker): kelas (jsonb), jumlah kitab/materi, ada tilawati, `boleh_kelola` (`boleh_kelola_target`) — kartu daftar & header detail.
- `v_target_kitab` (security_invoker): baris kitab + `teks` + surat:ayat untuk diedit.
- `simpan_isi_target(target_id, kitab jsonb, materi_item_ids uuid[], tilawati jsonb)`: ganti seluruh isi target secara atomik; `salin_isi_target(sumber_id, tujuan_id)` menyalin isi periode sebelumnya ke target baru.
- `fn_rentang_masukan(baris jsonb, nomor)`: konversi & validasi satu baris rentang (halaman atau surat:ayat), dipakai bersama `simpan_materi_kegiatan` dan `simpan_isi_target`.
- Info target (judul, periode, kelas) lewat insert/update biasa; trigger menolak periode bertumpukan (`23P01`) dan Server Action menampilkannya sebagai pesan ramah.

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

**Terimplementasi (Tahap 5):** `v_satuan_disampaikan`, `v_satuan_diikuti`, `fn_progres_anak(generus_id)` (per kitab & jenis: total, diikuti, kelas, `terlewat` jsonb rentang via `fn_ringkas_rentang`), `fn_progres_quran_per_surat(generus_id, jenis)`, `fn_capaian_target_kitab(generus_id, target_id)` (satuan dalam rentang target), `fn_rekap_presensi` (persen = hadir+terlambat ÷ presensi terisi, kegiatan libur tidak dihitung), `v_penilaian_terakhir`, `v_materi_item_diterima`, `v_posisi_tilawati`, `v_susulan`. Penulisan: `simpan_susulan`, `tambah_tilawati` (berhenti di akhir jilid, mengembalikan `sisa` → UI menawarkan naik jilid), `atur_posisi_tilawati` (koreksi/naik jilid, divalidasi jumlah halaman jilid); semuanya memanggil `cek_boleh_nilai` (admin atau guru kelas anak) lalu RLS. Penilaian ditulis langsung ke tabel `penilaian` (hanya baris yang berubah). Kelas pembanding progres = kelas anak **saat ini**.

**Per periode & rekap (Tahap 6):** semua periode (bulan, periode target, semester tetap Jul–Des/Jan–Jun, keseluruhan) diterjemahkan ke rentang tanggal di `lib/periode.ts`. `fn_satuan_diikuti(generus, dari, sampai)` & `fn_satuan_disampaikan(kelas, dari, sampai)` menjadi dasar `fn_progres_anak(generus, dari, sampai)` dan `fn_progres_quran_per_surat(generus, jenis, dari, sampai)` (argumen tanggal ber-default = keseluruhan). Materi terlewat = disampaikan di periode yang **belum pernah** diikuti (kapan pun). `fn_rekap_kelas(kelas, dari, sampai)` → per anak aktif: kehadiran, `perlu_perhatian` (persen < `pengaturan.ambang_kehadiran`), satuan kelas vs diikuti, butir target periode yang beririsan & yang tuntas, posisi tilawati; `fn_rekap_kelas_ringkas` → rata-rata kelas. Raport memakai data Progres Anak pada periode yang sama; `catatan_raport` per bulan (raport bulanan/periode target menulis ke bulan awal periodenya).

**Beranda:** `fn_kehadiran_harian(dari, sampai, kelas_ids?)` (filter menurut kelas **anak**, sehingga kegiatan gabungan terbagi benar) (hadir+terlambat ÷ presensi per hari, hari tanpa kegiatan tetap muncul) + `fn_rekap_kelas_ringkas` untuk target berjalan + `fn_rekap_kelas` (bulan ini) untuk perlu perhatian. Target punya kolom `rentang_usia` (keterangan target Caberawit dari PPG).

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
| Master data (kelas, kitab, guru, jadwal) | semua pengguna masuk | admin |
| `materi_item` | semua pengguna masuk | admin, guru (berlaku sekelompok) |
| `generus` | admin, pengurus; guru (kelasnya); wali (anaknya) | admin |
| `kegiatan*`, `presensi`, `susulan` | admin, pengurus; guru (kelasnya); wali (kegiatan kelas anaknya / yang ada presensi anaknya) | admin; guru (kelasnya) |
| `penilaian`, `capaian_tilawati` | admin, pengurus; guru (kelasnya); wali (anaknya) | admin; guru (kelasnya) |
| `target_*` | semua pengguna masuk | admin; guru bila mengajar ≥1 kelas target atau pembuatnya (`boleh_kelola_target`); guru hanya menautkan kelas yang diajarnya |
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
│   │   ├── beranda/                  # ringkasan: hari ini, kehadiran 7 hari, perlu perhatian, target berjalan (admin, guru, pengurus)
│   │   ├── hari-ini/                 # Pengajian Hari Ini
│   │   ├── kegiatan/                 # baru/ (kegiatan khusus), [id]/ (Materi → Kehadiran → Selesai), [id]/ubah/
│   │   ├── riwayat/                  # kegiatan 60 hari terakhir
│   │   ├── generus/              # daftar (+naik kelas massal), baru/, [id]/ubah/; [id]/ = progres anak (+ penilaian, tilawati), [id]/susulan/
│   │   ├── penilaian/                # satu butir untuk banyak anak: ?kelas=&item= atau ?kegiatan=&item= (anak yang hadir)
│   │   ├── anakku/                   # daftar anak untuk wali → progres anak
│   │   ├── target/                   # daftar (berjalan/akan datang/lewat), baru/ (+salin isi), [id]/ (isi per aspek), [id]/ubah/
│   │   ├── rekap/                    # rekap per kelas & periode (admin, pengurus) + daftar perlu perhatian
│   │   ├── raport/                   # pilih kelas/anak; [id]/ raport anak (cetak A4 + catatan); kelas/[id]/ semua raport sekelas
│   │   ├── lembar-presensi/          # lembar presensi cetak per kelas per bulan (A4 mendatar)
│   │   ├── lainnya/                 # profil, ganti mode, keluar, menu kelola
│   │   └── kelola/                   # master data: jadwal rutin, kelas, guru, akun (& wali), kitab, materi, tilawati — admin ubah, pengurus lihat
│   ├── manifest.ts                   # manifest PWA (/manifest.webmanifest)
│   ├── ikon/[ukuran]/                # ikon PWA 192/512/maskable/apple (next/og, dibuat saat build)
│   ├── ~offline/                     # halaman tanpa koneksi (di-precache)
│   ├── serwist/[path]/               # route pembangun service worker
│   └── sw.ts                         # service worker (Serwist): aset statis saja
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
| Deploy | Vercel Hobby terhubung ke GitHub (deploy otomatis dari `main`, preview per PR); region fungsi `sin1` (`vercel.json`) |
| Migrasi produksi | Manual: `pnpm exec supabase db push --db-url "<session pooler produksi>"` (CLI tetap ter-link ke dev) |
| Backup | `.github/workflows/backup.yml` mingguan (Senin 02.00 WIB): `supabase db dump` roles + skema + data (termasuk `auth`) → `tar.gz` → GPG AES-256 → artifact 90 hari |
| Supabase pause (7 hari tidak aktif) | `.github/workflows/keep-alive.yml`: satu permintaan REST per hari |
| PWA | Serwist: hanya aset statis yang di-cache; halaman & data selalu dari jaringan; tanpa koneksi → `/~offline`. SW nonaktif di dev |

**Langkah deploy pertama (oleh pemilik akun):**
1. **Supabase produksi**: buat proyek `pantau-generus` (region Singapore). Authentication → Sign In / Providers: Email aktif, **matikan pendaftaran baru** dan konfirmasi email (sama seperti dev). Catat URL, publishable key, secret key, dan *Session pooler connection string* (Connect → Session pooler).
2. **Skema**: `pnpm exec supabase db push --db-url "<session pooler produksi>"` — semua migrasi diterapkan; jangan pernah `db reset` ke produksi.
3. **Admin pertama**: salin `.env.example` → `.env.produksi.local` berisi kunci produksi, lalu `pnpm akun:buat:produksi --nama "…" --hp 08… --pin …… --peran admin --kelompok "…"`.
4. **Kelas baku**: `pnpm exec supabase db query --db-url "<session pooler produksi>" -f supabase/data/kelas-awal.sql` (TK, 1A–3B, Pra-remaja, Usia sekolah (SLTA), Usia mandiri — aman dijalankan ulang).
5. **Vercel**: Add New → Project → impor repo GitHub; isi Environment Variables (Production) `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `AUTH_EMAIL_DOMAIN` (sama dengan dev); Deploy.
6. **GitHub → Settings → Secrets and variables → Actions**: `SUPABASE_DB_URL` (session pooler produksi), `BACKUP_PASSPHRASE` (simpan juga di tempat aman — tanpa ini backup tidak bisa dibuka), `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`. Jalankan **Backup mingguan** dan **Keep-alive** sekali lewat *Run workflow* untuk memastikan berhasil.
7. **Uji**: buka domain Vercel di HP Android → masuk → "Pasang" → buka dari layar utama.

**Memulihkan backup:** unduh artifact → `gpg -d pantau-generus-YYYYMMDD.tar.gz.gpg > b.tar.gz && tar -xzf b.tar.gz` → ke proyek Supabase baru/kosong:
`psql --single-transaction --variable ON_ERROR_STOP=1 --file roles.sql --file schema.sql --command "SET session_replication_role = replica" --file data.sql --dbname "<connection string>"`.

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
| 13 | Materi item yang disampaikan dicatat per kegiatan (`kegiatan_materi_item`), terpisah dari penilaian | Materi item hanya lewat penilaian per anak | Kegiatan kelas sering membahas butir Faqih/Akhlaq untuk semua; raport bisa menunjukkan butir yang terlewat tanpa guru menilai satu per satu |
