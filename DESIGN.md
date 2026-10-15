# DESIGN — Sistem Pemantauan Target Generus

> Status: v0.2 · 15 Okt 2026 (gaya baru mengikuti referensi Zenius). Pengguna utama berusia **30–50 tahun**, banyak yang tidak terbiasa dengan aplikasi. Setiap keputusan desain mengutamakan **mudah dibaca, sulit salah tekan, dan sedikit langkah**.

## 1. Prinsip

1. **Satu layar, satu tugas.** Setiap halaman punya satu aksi utama yang jelas (tombol utama menempel di bawah pada HP).
2. **Teks dulu, ikon pendukung.** Ikon selalu disertai label. Tidak ada tombol ikon tanpa teks, kecuali tombol tutup/kembali.
3. **Bahasa sehari-hari.** "Simpan Kehadiran", bukan "Submit Presensi". Lihat §8.
4. **Default yang benar.** Isi otomatis apa yang bisa ditebak (tanggal hari ini, semua hadir, guru dari jadwal, salin bulan lalu).
5. **Aman dari salah tekan.** Aksi merusak (hapus, batalkan kegiatan) butuh konfirmasi; perubahan biasa bisa **dibatalkan** (toast "Urungkan").
6. **Jangan andalkan warna saja.** Status selalu punya teks/ikon, bukan hanya warna.
7. **Responsif penuh** — mobile-first, dan sama nyamannya di tablet serta desktop (lihat §5.1).

## 2. Tipografi

| Token | Ukuran | Pemakaian |
|---|---|---|
| `text-sm` / `text-xs` | **13px** | Keterangan, chip, label kecil — **ukuran minimum** |
| `text-base` | **15px** / line-height 1.55 | Teks dasar |
| `text-lg` | 16px | Nama di daftar, judul kartu |
| `text-xl` | 18px | Angka di kotak ringkas |
| `text-2xl` | 22px | Judul halaman |
| `text-3xl`–`text-4xl` | 26–32px | Angka besar (jarang) |

- Font: **Plus Jakarta Sans** (variabel, Google Fonts lewat `next/font`, fallback `system-ui`). Angka memakai `tabular-nums`. Judul sedikit dirapatkan (`letter-spacing: -0.01em`).
- Diputuskan 15 Okt 2026 (referensi *Online education dashboard*, Dribbble): lebih ringkas dari sebelumnya (18px) atas permintaan pengguna; ukuran minimum 13px dan kontras tetap ≥ 4.5:1.

## 3. Warna

Arah visual (15 Okt 2026) mengikuti referensi *Zenius — Online education dashboard*: **latar abu sangat muda, kartu putih bergaris tipis, teal sebagai warna utama, oranye hanya aksen**. Tanpa blok warna besar dan tanpa ornamen, agar tenang & profesional.

| Token | Nilai | Pemakaian |
|---|---|---|
| `--primary` / `--brand` | Teal `#0D807C` | Tombol utama, tautan, item aktif, bar progres (kontras teks putih 4,9:1) |
| `--ring` | `#17BDB7` | Cincin fokus |
| `--mint` | `#E6FAF9` (teks `#0B6B68`) | Item aktif di menu, avatar, badge "sudah", kotak jam |
| `--kunyit` | Oranye `#BA5722` | Aksen jarang: penanda perubahan/terlewat, garis pembanding kelas |
| `--background` | `#F3F5F5` | Latar halaman |
| `--card` | `#FFFFFF` + garis `#E9EAEA` | Kartu, form, sidebar, navigasi bawah |
| `--foreground` / `--teks-2` | `#141616` / `#3D4343` | Teks utama / sekunder |
| `--muted-foreground` | `#646B6B` | Keterangan (kontras 5,3:1) |
| `--secondary` | `#EEF1F1` | Latar tombol segmen, bar kosong |
| `--destructive` | `#B42318` | Hapus, alpa, galat |

Warna status (chip, peringatan) memakai pasangan lembut `ok`/`warn`/`info`/`ungu`/`bahaya` (latar `*-soft`, teks gelap) dan **selalu** disertai simbol + kata. Kontras minimum **WCAG AA (4.5:1)** untuk semua teks.

**Makna warna (wajib konsisten):**

| Nada | Arti | Contoh pemakaian |
|---|---|---|
| Teal (`ok`, `primary`) | Beres / positif / aksi utama | Hadir, Selesai, Lancar/Paham/Terbiasa, target tercapai, "semua sudah diisi" |
| Biru (`info`) | Informasi / sedang berjalan, netral | Sudah diisi (belum selesai), Izin, Lulus, penanda Target, petunjuk "belum ada periode target" |
| Oranye (`warn`, `kunyit`) | Perlu tindakan, bukan galat | Belum diisi, Terlambat, Proses, materi terlewat, perubahan belum disimpan, batang kehadiran < 60% |
| Merah (`bahaya`, `destructive`) | Galat, bahaya, masalah | Alpa, Perlu perhatian, pesan galat, Hapus |
| Ungu (`ungu`) | Kategori khusus | Sakit, butir khusus putra/putri |
| Abu (`secondary`) | Netral / tidak aktif | Libur, Pindah, Nonaktif, Belum dinilai, angka nol |

Petunjuk umum (mis. "Ketuk nama anak yang tidak hadir") memakai mint (`--mint`), bukan biru.

### Warna Status Presensi

| Status | Warna | Label & ikon |
|---|---|---|
| Hadir | teal | ✓ Hadir |
| Terlambat | oranye | ⏱ Terlambat |
| Izin | biru | ✉ Izin |
| Sakit | ungu | ✚ Sakit |
| Alpa | merah | ✕ Alpa |

### Warna Status Penilaian

Tiga tingkat yang sama di database (`belum`/`proses`/`lancar`); **label mengikuti aspek** materi:

| Status | Alim (Hafalan) | Faqih | Akhlaqul Karimah & Mandiri | Warna |
|---|---|---|---|---|
| `belum` | ○ Belum | ○ Belum | ○ Belum | abu-abu |
| `proses` | ◐ Proses | ◐ Proses | ◐ Proses | oranye |
| `lancar` | ● Lancar | ● Paham | ● Terbiasa | teal |

## 4. Ukuran & Jarak

- **Tombol utama tinggi 44px** (lebar penuh di HP), tombol biasa 40px, kecil 36px; isian 44px. Target sentuh tetap ≥ 40px, jarak antar elemen yang bisa diketuk ≥ 8px.
- Padding halaman 16px (HP), 32px (desktop).
- Radius `--radius: 0.625rem` (10px): tombol & isian 10px, kartu 16px, chip & avatar bulat penuh.
- Kartu: putih, garis 1px, **tanpa bayangan**; bayangan halus hanya saat kartu yang bisa diketuk di-hover.
- Lebar konten maksimum 768px untuk halaman isian; 1200px untuk rekap/tabel.

## 5. Navigasi

**Mobile:** bottom navigation, maksimal 4 item + label, sesuai peran.

| Peran | Item navigasi |
|---|---|
| Admin | Beranda · Hari Ini · Generus · Lainnya |
| Guru | Beranda · Hari Ini · Kelasku · Lainnya |
| Pengurus | Beranda · Rekap · Raport · Lainnya |
| Wali | Anakku · Raport · Lainnya |

Menu lain (Target, Riwayat, Rekap, Raport sesuai peran) ada di sidebar desktop dan di grup **Menu lain** pada halaman Lainnya (HP).

- **Lainnya** ada di semua peran: profil, menu lain, Ganti Mode, Keluar, dan (admin/pengurus) menu Kelola data.
- Sidebar desktop: menu bisa digulir sendiri; kartu profil (nama + peran) tetap di bawah.
- Pengguna dengan beberapa peran: tombol **"Ganti Mode"** di Lainnya; mode tersimpan di cookie dan menentukan navigasi.
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

### 7.1a Beranda (Admin, Guru, Pengurus)
- Halaman pertama setelah masuk. Sapaan + tanggal; tiga kotak ringkas pengajian hari ini (total, sudah diisi, belum diisi).
- **Perlu diisi hari ini**: kartu kegiatan yang belum diisi (atau pesan "semua sudah diisi").
- **Kehadiran 7 hari terakhir**: persen keseluruhan + grafik batang per hari (teal ≥ 60%, oranye di bawahnya, batang kosong = tidak ada pengajian). Filter tombol segmen **Semua · Caberawit · Pra-remaja · Remaja**, lalu chip kelas bila jenjangnya punya lebih dari satu kelas (Caberawit TK–3B; Remaja Usia sekolah/Usia mandiri). Filter tersimpan di URL dan tidak menggulir halaman.
- **Perlu perhatian**: anak dengan kehadiran bulan ini di bawah ambang (maks. 6, sisanya ke Rekap).
- **Target berjalan**: per kelas, cincin rata-rata butir target tuntas + materi diikuti.
- Guru hanya melihat kelas yang diajarnya; wali diarahkan ke Anakku.

### 7.2 Pengajian Hari Ini (Admin/Guru)
- Judul: "Senin, 13 Oktober 2026".
- Kartu per kegiatan: nama kelas (kegiatan gabungan menampilkan semua kelas, mis. "Usia sekolah (SLTA) + Usia mandiri"), jam, pengajar, status (Belum diisi / Sudah diisi / Libur).
- Ketuk kartu → detail kegiatan.
- Tombol sekunder: "+ Kegiatan Lain".

### 7.3 Detail Kegiatan
Tiga langkah berurutan dengan indikator ✓:
1. **Materi** — Al-Hadist (kitab + halaman) atau Al-Qur'an (surat:ayat), bisa tambah baris; **materi lain yang disampaikan** (kartu centang; butir target periode di atas, sisanya lewat daftar yang bisa dicari); rundown opsional (dilipat). Form "Tambah Kegiatan" memberi petunjuk bahwa materi diisi di langkah ini.
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
- Menjadi langkah ke-3 detail kegiatan bila ada kelas Caberawit; di HP empat langkah memakai label singkat (Materi · Hadir · Tilawati · Selesai) dengan indikator di atas label.
- Anak tanpa posisi: tombol **Isi posisi awal** (pilih jilid + halaman).
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
- Tilawati: "Jilid 3 · hal. 24" + tombol +N yang sama seperti §7.4a (bagi yang berhak).
- Kartu target periode berjalan: bar per baris bacaan/makna target (anak vs yang sudah disampaikan di kelas), jumlah butir target yang tuntas, tilawati target vs posisi.
- Materi terlewat per rentang punya tombol **Catat susulan** (isian sudah terisi rentangnya). Riwayat susulan bisa dihapus bila salah catat.
- Penilaian materi item dikelompokkan per aspek, tiga tombol per butir; baris yang diubah ditandai "belum disimpan" sampai tombol **Simpan Penilaian (n)** ditekan.
- Kartu kehadiran menampilkan chip **Perlu perhatian** bila persen bulan ini < ambang (default 60%).

### 7.5a Penilaian (Admin/Guru)
- Satu butir untuk banyak anak: pilih kelas → pilih butir (target periode di atas, sisanya per aspek) → daftar anak dengan tiga tombol.
- Dari langkah Selesai kegiatan: **Nilai materi pengajian** → butir yang disampaikan → hanya anak yang hadir.

### 7.6 Target Bulanan (Admin)
- Daftar periode target (judul, tanggal mulai–selesai, kelas yang dicakup). Buat baru → tombol besar **"Salin dari periode sebelumnya"**.
- Bagian mengikuti dokumen PPG: **Alim** (Bacaan, Makna, Hafalan), **Faqih**, **Akhlaqul Karimah**, **Mandiri** (+ Tilawati untuk Caberawit). Kelas dipilih dengan kartu bercentang (boleh lebih dari satu).

### 7.6a Rekap (Admin, Pengurus)
- Pilihan periode (tombol segmen): **Bulan · Target · Semester · Semua** + panah ‹ › untuk periode sebelum/sesudah; pilihan kelas berupa chip yang bisa digeser. Pilihan periode yang sama dipakai di Progres Anak dan Raport, dan ikut terbawa saat mengetuk nama anak.
- Kartu **Perlu perhatian** di atas (kehadiran < ambang), lalu per kelas: tiga angka ringkas (rata-rata kehadiran, materi diikuti, butir target tuntas) dan daftar anak — kartu di HP, tabel di desktop. Urut nama, tanpa peringkat.
- Tombol per kelas: **Lembar presensi** dan **Raport kelas**.

### 7.6b Lembar Presensi (cetak)
- Per kelas per bulan, A4 mendatar: No · Nama · kolom tanggal pengajian (jadwal rutin + kegiatan yang ada, minimal 8 kolom). Presensi yang sudah tercatat ikut tercetak (H/T/I/S/A).

### 7.7 Raport (cetak)
- Ukuran A4 portrait, `@media print`: sembunyikan navigasi, tombol; font 12pt; hitam-putih tetap terbaca.
- Kop: nama kelompok, judul "Raport Bulanan/Semester/Periode Target/Keseluruhan", periode, nama, kelas, periode target.
- Isi bertabel bergaris: Kehadiran · Bacaan & makna (capaian target + materi periode) · Butir materi per aspek (status + sudah menerima) · Tilawati (Caberawit) · Materi terlewat · Catatan · tanda tangan Orang tua/Wali & Pengajar/Pengurus.
- Catatan diisi di layar (admin, pengurus, guru kelasnya) dan ikut tercetak. "Cetak raport kelas" mencetak semua anak, satu anak per halaman.

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
  - Android/Chrome: kartu "Pasang Pantau Generus" dengan tombol **Pasang** (dialog bawaan) dan **Nanti saja**. iPhone: langkah "Bagikan → Tambahkan ke Layar Utama". Tidak muncul lagi setelah ditutup atau bila sudah terpasang.
- Ikon: bintang delapan putih di atas gradasi teal (sama dengan tanda logo di sidebar & halaman Masuk).
- Tanpa internet: halaman "Tidak ada koneksi internet" + tombol **Coba lagi** (mode offline penuh bukan tujuan versi pertama).
- Halaman Masuk: PIN tampil sebagai titik; tombol **Tampilkan / Sembunyikan** di samping label PIN.

## 11. Gerak & Umpan Balik

Gerak halus, singkat (150–320ms, kurva `--ease-halus`), dan **dimatikan** bila pengguna memilih *kurangi gerak* (`prefers-reduced-motion`).

| Situasi | Perilaku |
|---|---|
| Membuka halaman | Isi muncul pelan (fade + naik 6px); daftar kartu muncul berurutan (`berurutan`, maks. 180ms) |
| Pindah menu | Ikon menu yang diketuk berdenyut selama halaman dimuat (`useLinkStatus`) |
| Menekan tombol / kartu | Mengecil sedikit (`scale 0.97–0.99`); kartu yang bisa diketuk terangkat 2px saat hover |
| Menyimpan | Tombol menampilkan putaran + "Menyimpan…" dan terkunci; hasilnya toast kartu terang (ikon ✓ teal / galat merah) di atas navigasi bawah |
| Mengubah status (presensi, penilaian, tilawati) | Chip "pop", getar 8ms di Android, ringkasan angka ikut "pop"; jumlah perubahan yang **belum disimpan** ditampilkan di samping tombol simpan |
| Progres | Bar & cincin terisi dari 0 saat tampil |
| Memuat data | Kerangka berkilau (bukan spinner kosong) |
| Galat isian | Pesan merah dengan ikon muncul di bawah isian; galat formulir di kotak merah lembut |
| Lembar bawah / dialog | Naik dari bawah (HP) dengan pegangan, atau membesar halus (desktop) |
