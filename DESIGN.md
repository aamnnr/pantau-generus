# DESIGN — Sistem Pemantauan Target Generus

> Status: Draft v0.1 · 13 Okt 2026. Pengguna utama berusia **30–50 tahun**, banyak yang tidak terbiasa dengan aplikasi. Setiap keputusan desain mengutamakan **mudah dibaca, sulit salah tekan, dan sedikit langkah**.

## 1. Prinsip

1. **Satu layar, satu tugas.** Setiap halaman punya satu aksi utama yang jelas (tombol besar di bawah).
2. **Teks dulu, ikon pendukung.** Ikon selalu disertai label. Tidak ada tombol ikon tanpa teks, kecuali tombol tutup/kembali.
3. **Bahasa sehari-hari.** "Simpan Kehadiran", bukan "Submit Presensi". Lihat §8.
4. **Default yang benar.** Isi otomatis apa yang bisa ditebak (tanggal hari ini, semua hadir, guru dari jadwal, salin bulan lalu).
5. **Aman dari salah tekan.** Aksi merusak (hapus, batalkan kegiatan) butuh konfirmasi; perubahan biasa bisa **dibatalkan** (toast "Urungkan").
6. **Jangan andalkan warna saja.** Status selalu punya teks/ikon, bukan hanya warna.
7. **Responsif penuh** — mobile-first, dan sama nyamannya di tablet serta desktop (lihat §5.1).

## 2. Tipografi

| Token | Ukuran | Pemakaian |
|---|---|---|
| `text-base` | **18px** / line-height 1.6 | Teks dasar (lebih besar dari default 16px) |
| `text-sm` | 16px | Teks sekunder — **ukuran minimum** |
| `text-lg` | 20px | Label penting, nama anak di daftar presensi |
| `text-xl` | 24px | Judul bagian |
| `text-2xl` | 30px | Judul halaman, angka utama di kartu |

- Font: **Inter** (fallback `system-ui`). Angka memakai `tabular-nums`.
- Tidak ada teks di bawah 16px. Tidak ada teks abu-abu muda di atas latar putih.

## 3. Warna

Token didefinisikan sebagai CSS variable (shadcn/ui) dengan mode terang (default) dan gelap.

| Token | Terang | Pemakaian |
|---|---|---|
| `--primary` | Hijau tua `#15803d` | Tombol utama, tautan, progres |
| `--primary-foreground` | `#ffffff` | Teks di atas primary |
| `--background` | `#ffffff` | Latar |
| `--muted` | `#f4f4f5` | Latar kartu sekunder |
| `--foreground` | `#18181b` | Teks utama |
| `--muted-foreground` | `#52525b` | Teks sekunder (kontras ≥ 7:1) |
| `--destructive` | `#b91c1c` | Hapus, alpa |
| `--border` | `#d4d4d8` | Garis |

Kontras minimum **WCAG AA (4.5:1)** untuk semua teks; target AAA (7:1) untuk teks dasar.

### Warna Status Presensi

| Status | Warna | Label & ikon |
|---|---|---|
| Hadir | hijau | ✓ Hadir |
| Terlambat | kuning tua | ⏱ Terlambat |
| Izin | biru | ✉ Izin |
| Sakit | ungu | ✚ Sakit |
| Alpa | merah | ✕ Alpa |

### Warna Status Penilaian

Tiga tingkat yang sama di database (`belum`/`proses`/`lancar`); **label mengikuti aspek** materi:

| Status | Alim (Hafalan) | Faqih | Akhlaqul Karimah & Mandiri | Warna |
|---|---|---|---|---|
| `belum` | ○ Belum | ○ Belum | ○ Belum | abu-abu |
| `proses` | ◐ Proses | ◐ Proses | ◐ Proses | kuning |
| `lancar` | ● Lancar | ● Paham | ● Terbiasa | hijau |

## 4. Ukuran & Jarak

- **Target sentuh minimum 48×48px**; tombol utama tinggi **56px**, lebar penuh di mobile.
- Jarak antar elemen yang bisa diketuk ≥ 8px.
- Padding halaman 16px (mobile), 24px (≥ md).
- Radius: `--radius: 0.75rem`.
- Lebar konten maksimum 768px untuk halaman isian; 1200px untuk rekap/tabel.

## 5. Navigasi

**Mobile:** bottom navigation, maksimal 4 item + label, sesuai peran.

| Peran | Item navigasi |
|---|---|
| Admin | Hari Ini · Generus · Target · Lainnya |
| Guru | Hari Ini · Kelasku · Riwayat |
| Pengurus | Beranda · Generus · Raport · Rekap |
| Wali | Anakku · Raport |

- Pengguna dengan beberapa peran: tombol **"Ganti Mode"** di menu Lainnya/profil.
- Wali dengan satu anak langsung masuk ke halaman anak; lebih dari satu → pilih anak (kartu besar dengan nama & kelas).
- Setiap halaman turunan punya tombol **← Kembali** berlabel di kiri atas.

### 5.1 Responsif (Mobile, Tablet, Desktop)

Dirancang **mobile-first**, lalu diperluas. Breakpoint mengikuti Tailwind:

| Lebar | Kelas | Navigasi | Tata letak |
|---|---|---|---|
| < 768px | Mobile (acuan 360px) | Bottom navigation | 1 kolom, tombol utama sticky lebar penuh |
| 768–1023px | Tablet (`md`) | Bottom navigation / rail ikon+label | 2 kolom untuk kartu & daftar presensi |
| ≥ 1024px | Desktop (`lg`) | **Sidebar kiri** tetap (label + ikon), nama pengguna & ganti mode di bawah | Konten + panel samping; tombol utama di kanan atas/bawah form (tidak sticky lebar penuh) |
| ≥ 1280px | Desktop lebar (`xl`) | Sidebar | Rekap/dashboard 3–4 kolom kartu |

Aturan adaptasi komponen:

| Komponen | Mobile | Desktop |
|---|---|---|
| Daftar data (generus, kegiatan) | Kartu bertumpuk | **Tabel** dengan sortir & filter di atas |
| Presensi cepat | Daftar 1 kolom | Grid 2–3 kolom; pintasan keyboard opsional |
| Pilih status / form tambahan | Bottom sheet | Dialog/popover |
| Detail kegiatan (Materi → Kehadiran → Selesai) | Langkah berurutan | Materi & Kehadiran berdampingan (2 panel) |
| Progres anak | Kartu bertumpuk | Grid 2 kolom (kehadiran + makna | hafalan + tilawati) |
| Rekap kelas | Kartu ringkas + daftar perhatian | Tabel lengkap + grafik |
| Formulir | Lebar penuh | Maks. 768px, label di atas field |

- Ukuran huruf & target sentuh **tidak mengecil** di desktop.
- Tidak ada scroll horizontal halaman di lebar mana pun; tabel lebar boleh scroll di dalam kontainernya.
- Uji setiap layar di **360px, 768px, dan 1280px**.

## 6. Pola Komponen

| Kebutuhan | Pola |
|---|---|
| Pilihan 2–5 opsi | Tombol segmen/kartu besar, **bukan** dropdown |
| Pilihan banyak (kitab, anak) | Daftar dengan pencarian |
| Tanggal | Default hari ini + tombol "Kemarin" / pilih tanggal |
| Rentang Al-Hadist | Pilih kitab, lalu dua input angka besar (`inputmode="numeric"`) "Dari hal." – "Sampai hal." |
| Rentang Al-Qur'an | "Dari": pilih **surat** (daftar dengan pencarian nama/nomor, mis. "2 · Al-Baqarah") + input **ayat**. "Sampai": default surat yang sama, bisa diganti. Tampilkan jumlah ayat surat ("dari 286 ayat") dan validasi langsung |
| Simpan | Tombol utama menempel di bawah layar (sticky) |
| Umpan balik | Toast di bawah ("Alhamdulillah Jaza Kumullahu Khoiro. Kehadiran tersimpan ✓") + opsi Urungkan bila relevan |
| Loading | Skeleton, bukan spinner kosong; tombol menampilkan "Menyimpan…" |
| Kosong | Ilustrasi sederhana + kalimat + tombol aksi ("Belum ada kegiatan hari ini. Tambah kegiatan") |
| Error | Kalimat yang jelas + apa yang harus dilakukan; jangan tampilkan kode error mentah |
| Progres | Bar horizontal + angka persen + pecahan ("45% · 54 dari 120 hal." / "12% · 748 dari 6.236 ayat") |

## 7. Layar Kunci

### 7.1 Masuk
- Logo/nama aplikasi, field **No. HP** (`inputmode="tel"`), field **PIN** (`inputmode="numeric"`, 6 kotak), tombol **Masuk**.
- Teks bantuan: "Lupa PIN? Hubungi admin kelompok."

### 7.2 Pengajian Hari Ini (Admin/Guru)
- Judul: "Senin, 13 Oktober 2026".
- Kartu per kegiatan: nama kelas (kegiatan gabungan menampilkan semua kelas, mis. "Pelajar + Pra-nikah"), jam, pengajar, status (Belum diisi / Sudah diisi / Libur).
- Ketuk kartu → detail kegiatan.
- Tombol sekunder: "+ Kegiatan Lain".

### 7.3 Detail Kegiatan
Tiga langkah berurutan dengan indikator ✓:
1. **Materi** — Al-Hadist (kitab + halaman) atau Al-Qur'an (surat:ayat), bisa tambah baris; rundown opsional (dilipat).
2. **Kehadiran** — presensi cepat. Kegiatan gabungan: nama dikelompokkan per kelas.
3. **Tilawati** *(hanya bila ada kelas Caberawit)* — lihat §7.4a.
4. **Selesai** — ringkasan + tombol "Tandai Selesai".

### 7.4 Presensi Cepat
- Banner: "Semua ditandai **Hadir**. Ketuk nama anak yang tidak hadir."
- Daftar nama (text-lg, baris tinggi 64px) dengan chip status di kanan.
- Ketuk nama → lembar bawah (bottom sheet) berisi 5 tombol status besar + kolom keterangan opsional.
- Ringkasan di atas: "Hadir 18 · Izin 1 · Sakit 0 · Alpa 1".
- Tombol sticky: **Simpan Kehadiran**.

### 7.4a Tilawati Cepat (Caberawit)
- Hanya anak yang **hadir** ditampilkan.
- Tiap baris: nama + posisi saat ini ("Jilid 3 · hal. 24") + tombol besar **+1 · +2 · +3 · …** (… membuka input angka).
- Setelah ditekan: posisi langsung diperbarui ("→ hal. 26") dengan toast **Urungkan**.
- Bila melewati jumlah halaman jilid: dialog "Selesai Jilid 3. Naik ke Jilid 4?" → **Ya, naik jilid** / Belum.
- Ketuk posisi untuk koreksi manual (pilih jilid + halaman).

### 7.5 Progres Anak (semua peran yang berhak)
- Header: nama, kelas, foto inisial.
- Kartu kehadiran bulan ini (persen besar + rincian).
- Kartu per kitab Al-Hadist: bar progres anak vs kelas, tautan "Materi terlewat: hal. 15–20".
- Kartu Al-Qur'an: progres total + daftar per surat yang sudah dimulai (bar kecil per surat), "Materi terlewat: Al-Baqarah 21–40".
- Daftar hafalan & praktik dengan status.
- Tilawati: "Jilid 3 · hal. 24".

### 7.6 Target Bulanan (Admin)
- Daftar periode target (judul, tanggal mulai–selesai, kelas yang dicakup). Buat baru → tombol besar **"Salin dari periode sebelumnya"**.
- Bagian mengikuti dokumen PPG: **Alim** (Bacaan, Makna, Hafalan), **Faqih**, **Akhlaqul Karimah**, **Mandiri** (+ Tilawati untuk Caberawit). Kelas dipilih dengan kartu bercentang (boleh lebih dari satu).

### 7.7 Raport (cetak)
- Ukuran A4 portrait, `@media print`: sembunyikan navigasi, tombol; font 12pt; hitam-putih tetap terbaca.
- Kop: nama kelompok, judul "Raport Bulanan", bulan, nama, kelas.

## 8. Gaya Bahasa (UI Copy)

| Gunakan | Hindari |
|---|---|
| Masuk | Login / Sign in |
| Kehadiran | Presensi log / Attendance |
| Simpan | Submit |
| Pengajian / Kegiatan | Event / Session |
| Anakku | Dependents |
| Materi terlewat | Gap materi |
| Wali / Orang tua | User wali |

- Kalimat pendek, sapaan sopan netral ("Silakan", bukan "Anda harus").
- **Salam:** "Assalamu'alaikum" (layar Masuk, sapaan di beranda: "Assalamu'alaikum, {nama}").
- **Terima kasih:** "Alhamdulillah Jaza Kumullahu Khoiro" — dipakai pada konfirmasi setelah menyimpan, bukan "Terima kasih"/"Berhasil".
- Tanggal: `Senin, 13 Okt 2026`; jam: `19.30` (format Indonesia).
- Angka: pemisah ribuan titik, persen tanpa desimal kecuali < 1%.

## 9. Aksesibilitas

- Semua input punya `<label>` terlihat (bukan hanya placeholder).
- Fokus keyboard terlihat jelas (ring 3px primary).
- Mendukung zoom browser hingga 200% tanpa scroll horizontal.
- `prefers-reduced-motion` dihormati; animasi minimal.
- Uji di HP Android layar 360px sebagai acuan terkecil.

## 10. PWA

- `display: standalone`, `theme_color` = primary, `background_color` putih.
- Ikon 192/512 + maskable.
- Nama pendek di layar utama: maksimal 12 karakter.
- Petunjuk pasang ("Tambahkan ke layar utama") ditampilkan sekali setelah login, bisa ditutup.
