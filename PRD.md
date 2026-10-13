# PRD — Sistem Pemantauan Target Generus

> Status: Draft v0.1 · 13 Okt 2026
> Nama aplikasi: belum final (nama kerja: **Pantau Generus**)

## 1. Latar Belakang

Pembinaan generus di kelompok berjalan rutin: Caberawit mengaji Senin–Sabtu, Pra-remaja dan Remaja pada Selasa dan Jumat malam. Saat ini pencatatan kehadiran, materi yang disampaikan, dan capaian target bulanan dari lembaga atas belum terpusat. Akibatnya:

- Sulit mengetahui sejauh mana materi (makna Al-Qur'an/Al-Hadist) sudah diikuti oleh **tiap anak**.
- Rekap bulanan/semester disusun manual dan memakan waktu.
- Orang tua tidak punya gambaran perkembangan anaknya.

## 2. Tujuan

1. Mencatat kegiatan pengajian (rundown, materi, pengajar) dan presensi secara cepat, termasuk oleh pengguna yang kurang paham teknologi.
2. Menghitung **progres materi per anak** secara otomatis dari materi yang disampaikan saat anak tersebut hadir.
3. Membandingkan capaian dengan **target bulanan** dari lembaga atas.
4. Menghasilkan **raport bulanan per anak** dan **rekap per kelas/jenjang** yang bisa dicetak.
5. Memberi orang tua akses lihat progres anaknya sendiri.

## 3. Bukan Tujuan (Non-Goals) untuk Versi Pertama

- Multi-kelompok/desa/daerah (struktur data disiapkan, fitur tidak dibangun).
- Mode offline (tahap berikutnya).
- Notifikasi (WhatsApp/push), chat, atau pengumuman.
- Pembayaran/infaq/keuangan.
- Aplikasi native di Play Store/App Store.
- Peringkat (ranking) antar anak.
- Login via OTP SMS, email, atau Google.

## 4. Pengguna & Peran

Pengguna utama berusia **30–50 tahun**, sebagian besar memakai HP Android kelas menengah ke bawah.

| Peran | Siapa | Kebutuhan utama |
|---|---|---|
| **Admin** | Pengurus yang ditunjuk mengelola data | Kelola master data, kegiatan, presensi, target bulanan; menginput atas nama guru |
| **Guru** | Guru ngaji | Mengisi materi, presensi, dan penilaian untuk kelas yang diajar. Akun **opsional** |
| **Pengurus** | Pengurus kelompok | Melihat semua progres; membuat raport & rekap |
| **Wali** | Orang tua/wali generus | Melihat progres & raport anaknya sendiri |

- Satu orang boleh memiliki lebih dari satu peran (mis. guru sekaligus wali).
- Guru tanpa akun tetap tercatat sebagai data; admin menginput atas namanya.
- Satu wali bisa terhubung ke beberapa anak.

### Matriks Hak Akses

| Fitur | Admin | Guru | Pengurus | Wali |
|---|:-:|:-:|:-:|:-:|
| Kelola jenjang/kelas, generus, guru, wali, akun | ✅ | – | lihat | – |
| Kelola kitab & daftar materi hafalan/praktik | ✅ | – | lihat | – |
| Kelola jadwal rutin | ✅ | – | lihat | – |
| Buat/ubah kegiatan, rundown, materi | ✅ semua kelas | ✅ kelasnya | lihat | – |
| Isi presensi | ✅ semua kelas | ✅ kelasnya | lihat | – |
| Penilaian hafalan/praktik/tilawati | ✅ | ✅ kelasnya | lihat | – |
| Input target bulanan | ✅ | – | lihat | – |
| Lihat progres | semua | kelasnya | semua | anaknya |
| Raport bulanan per anak | lihat | lihat kelasnya | ✅ buat/cetak | lihat anaknya |
| Rekap kelas/jenjang | lihat | – | ✅ | – |

## 5. Struktur Jenjang & Kelas

```
Caberawit   → Kelas A, Kelas B, Kelas C   (rincian menyusul)
Pra-remaja  → (usia SMP)
Remaja      → Pelajar (SLTA), Pra-nikah
```

- **Jenjang** tetap: Caberawit, Pra-remaja, Remaja.
- **Kelas** dapat dikelola admin (tambah, ubah nama, urutan, nonaktifkan).
- Setiap generus berada di tepat satu kelas aktif. Riwayat perpindahan kelas disimpan.
- Status generus: `aktif`, `lulus` (mis. sudah menikah), `pindah`, `nonaktif`.

## 6. Fitur

### F1. Autentikasi
- Login dengan **No. HP + PIN** (6 digit). Tanpa SMS/OTP.
- Akun dibuat oleh admin; tidak ada pendaftaran mandiri.
- Admin dapat mereset PIN.
- Sesi bertahan lama (tidak perlu login ulang setiap hari).

**Kriteria terima:** pengguna bisa login hanya dengan nomor HP format apa pun (`0812…`, `+62812…`, `62812…`) dan PIN.

### F2. Master Data
- Jenjang & kelas, generus (nama, jenis kelamin, tanggal lahir, kelas, status, wali), guru (dengan/tanpa akun, kelas yang diajar), wali.
- **Kitab**: nama, jenis (`quran` | `hadist`). Satuan progres:
  - **Al-Hadist → per halaman** kitab (admin mengisi total halaman).
  - **Al-Qur'an → per surat & ayat** (bukan halaman mushaf, karena halaman berbeda antar mushaf). Data 114 surat beserta jumlah ayatnya (standar Kemenag, total 6.236 ayat) sudah tersedia di aplikasi.
- **Materi item** hafalan & praktik: nama, jenis, jenjang/kelas yang berlaku.
- **Naik kelas massal**: pilih banyak generus → pindahkan ke kelas tujuan.

### F3. Jadwal Rutin & Kegiatan
- Admin mengatur jadwal rutin per kelas (hari, jam, guru default).
- Kegiatan dari jadwal rutin **disiapkan otomatis** dan muncul di halaman **"Pengajian Hari Ini"**.
- Kegiatan berisi: tanggal, jam, **satu atau beberapa kelas** (kegiatan gabungan, mis. pengajian umum seluruh Remaja), pengajar (≥1), **rundown** (urutan, waktu, aktivitas), **materi yang disampaikan**, catatan.
- Materi makna (boleh lebih dari satu baris):
  - Al-Hadist: `kitab + halaman mulai–selesai`
  - Al-Qur'an: `surat:ayat mulai – surat:ayat selesai` (boleh lintas surat, mis. Al-Baqarah 280 – Ali 'Imran 10)
- Kegiatan bisa: ditambah manual (kegiatan khusus), dibatalkan/diliburkan, ditandai selesai.
- Tercatat **pengajar** dan **penginput** (bisa berbeda).
- **Kegiatan gabungan**: peserta presensi = seluruh generus aktif dari semua kelas yang dipilih. Materi yang disampaikan dihitung ke progres setiap kelas peserta. Guru dapat mengelola kegiatan gabungan bila mengajar minimal salah satu kelasnya.

### F4. Presensi
- Status: `hadir`, `terlambat`, `izin`, `sakit`, `alpa`.
- **Presensi cepat**: semua anak di kelas default `hadir`; pengguna cukup mengetuk yang tidak hadir lalu simpan.
- Bisa diubah setelah disimpan (dengan jejak siapa yang mengubah).
- **Lembar presensi cetak** (PDF) per kelas untuk guru yang memakai kertas.

### F5. Target Bulanan
- Admin menginput target per kelas per bulan:
  - Makna: Al-Hadist `kitab + rentang halaman`; Al-Qur'an `rentang surat:ayat`
  - Hafalan: daftar materi item
  - Praktik: daftar materi item
  - Tilawati (Caberawit): target jilid/halaman
- Tombol **"Salin dari bulan lalu"**.

### F6. Progres
Aturan perhitungan **makna (Al-Qur'an & Al-Hadist)**:

*Satuan* = halaman (Al-Hadist) atau ayat (Al-Qur'an).

1. **Progres kelas** = satuan unik yang pernah disampaikan di kegiatan kelas ÷ total satuan (seluruh kitab/Al-Qur'an, atau rentang target).
2. **Progres anak** = satuan unik dari kegiatan di mana anak berstatus `hadir`/`terlambat`, **ditambah** satuan susulan ÷ total satuan.
3. Satuan dihitung **unik** — pengulangan tidak menambah progres.
4. `izin`, `sakit`, `alpa` tidak menambah progres, tetapi tercatat.
5. **Materi terlewat** = satuan progres kelas − satuan progres anak (ditampilkan sebagai rentang, mis. "hal. 15–20" atau "Al-Baqarah 21–40").
6. **Susulan**: admin/guru dapat mencatat bahwa anak sudah mengejar materi terlewat (rentang materi + tanggal).
7. Al-Qur'an juga ditampilkan **per surat** (mis. "Al-Baqarah 45%, Ali 'Imran 10%").

Aturan **hafalan & praktik**: tidak dihitung dari kehadiran. Dinilai per anak per materi item dengan status `belum` / `proses` / `lancar` (tanpa nilai angka untuk versi pertama). Riwayat penilaian disimpan; status terakhir yang berlaku.

Aturan **tilawati**: dicatat **per anak** (jilid + halaman terakhir) karena posisi tiap anak berbeda.
- Input cepat dengan tombol **+1 / +2 / +3** (atau angka lain) sesuai jumlah halaman yang diselesaikan anak pada pertemuan itu; bisa juga mengisi posisi langsung (koreksi).
- Jumlah halaman tiap jilid dapat diatur admin. Bila halaman melewati batas jilid, aplikasi menawarkan **naik jilid** (tidak otomatis, perlu konfirmasi guru).
- Pencatatan bisa dilakukan dari dalam kegiatan Caberawit (hanya anak yang hadir ditampilkan) atau dari halaman anak.

### F7. Raport & Rekap
**Raport bulanan per anak:**
- Identitas (nama, kelas, bulan)
- Kehadiran: jumlah & persentase per status
- Makna: progres per kitab vs target bulan
- Hafalan & praktik: status per materi item target
- Tilawati: posisi saat ini vs target
- Materi terlewat
- Catatan pengajar/pengurus
- Cetak / simpan PDF

**Raport semester**: agregasi 6 bulan.

**Rekap kelas/jenjang:**
- Rata-rata kehadiran & capaian target
- Daftar **anak yang perlu perhatian** (kehadiran < ambang, atau materi terlewat banyak). Ambang dapat diatur, default kehadiran < 70%.
- Tidak ada peringkat.

### F8. PWA
- Dapat dipasang ke layar utama (installable), ikon & splash screen.
- **Responsif penuh**: dirancang mobile-first dan nyaman di tablet maupun desktop/laptop (navigasi, tabel, dan formulir menyesuaikan lebar layar — lihat DESIGN.md §5–6).

## 7. Kebutuhan Non-Fungsional

| Aspek | Kebutuhan |
|---|---|
| Biaya | 100% layanan gratis (Vercel Hobby, Supabase Free) |
| Kinerja | Halaman utama siap < 3 detik di 4G pada HP kelas menengah |
| Keamanan | Hak akses ditegakkan di database (RLS); wali tidak bisa membaca data anak lain |
| Aksesibilitas | Lihat [DESIGN.md](DESIGN.md) — huruf besar, target sentuh besar, kontras tinggi |
| Bahasa | Antarmuka Bahasa Indonesia |
| Zona waktu | Asia/Jakarta (WIB) |
| Data | Backup mingguan otomatis |

## 8. Tahapan Rilis

| Tahap | Isi | Status |
|---|---|---|
| 0 | Dokumen fondasi (PRD, Arsitektur, Desain) | ⏳ |
| 1 | Setup proyek, skema DB + RLS, auth No. HP + PIN | – |
| 2 | Master data (kelas, generus, guru, wali, kitab, materi item) | – |
| 3 | Jadwal rutin, kegiatan, presensi cepat | – |
| 4 | Target bulanan | – |
| 5 | Progres, susulan, penilaian hafalan/praktik/tilawati | – |
| 6 | Raport & rekap, cetak PDF | – |
| 7 | PWA, deploy, backup | – |
| Nanti | Mode offline, multi-kelompok, notifikasi | – |

## 9. Pertanyaan Terbuka

1. Rincian kelas Caberawit (A/B/C) — rentang usia/kriteria tiap kelas?
2. ~~Tilawati~~ → diputuskan: per anak, input +N halaman (lihat F6).
3. Apakah raport perlu format/kop khusus dari lembaga atas?
4. Ambang "perlu perhatian" selain kehadiran < 70%?
5. ~~Satuan makna Al-Qur'an~~ → diputuskan: per surat & ayat.
6. ~~Nilai angka~~ → diputuskan: hafalan/praktik cukup status `belum/proses/lancar` untuk sementara.
