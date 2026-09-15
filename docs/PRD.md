# PRD: Situs Portofolio Profesional Arnal Firmansyah

**Pemilik produk:** Arnal Firmansyah
**Peran yang ditargetkan:** IT Lead / Supervisor (Head of IT)
**Versi dokumen:** 1.0
**Terakhir diperbarui:** 2026-09-14
**Status produk:** Implementasi awal selesai, siap diuji dan diisi data asli

> Dokumen ini adalah sumber kebenaran requirement. Setiap penambahan fitur atau perubahan
> requirement wajib dicatat di sini, termasuk pada bagian Riwayat Perubahan.
> Aturan dan tata cara pencatatan dijelaskan pada skill `prd-guardian`.

---

## 1. Ringkasan Produk

Situs portofolio ini dibuat untuk satu tujuan yang spesifik: meyakinkan pengambil keputusan teknis
(CTO, Head of IT, manajer perekrutan) bahwa pemiliknya layak memimpin tim IT, bukan sekadar
mengerjakan tugas teknis.

Masalah yang ingin diselesaikan:

1. Portofolio IT umumnya berupa daftar teknologi dan tautan repositori. Itu tidak menunjukkan kemampuan memimpin, mengambil keputusan di bawah tekanan, atau mengelola anggaran dan orang.
2. Format CV menghapus konteks: apa yang gagal, apa yang mahal, dan apa yang akhirnya diubah.
3. Situs portofolio hasil generator terlihat seragam satu sama lain, sehingga justru melemahkan kredibilitas.

Cara situs ini menjawabnya:

- Menyajikan **data kepemimpinan yang bisa diperiksa**: jumlah orang yang dipimpin, jumlah titik yang dijaga, masa berlaku sertifikasi, biaya belajar, dampak tiap proyek.
- Menampilkan **kegagalan beserta harganya**, bukan hanya keberhasilan.
- Memisahkan tegas antara **penilaian mandiri** dan **data terverifikasi pihak ketiga**.
- Membangun bahasa visual sendiri ("Rust & Ink") yang tidak memakai pola template umum.

## 2. Sasaran dan Ukuran Keberhasilan

| Kode | Sasaran | Ukuran |
|---|---|---|
| G-1 | Pengunjung memahami skala tanggung jawab dalam 10 detik pertama | Angka kunci (tahun pengalaman, orang yang dipimpin, titik yang dijaga) tampil di layar pertama tanpa menggulir pada layar 1280px |
| G-2 | Situs terasa interaktif, bukan brosur statis | Setiap aksi pengguna (hover, klik, filter, drag) menghasilkan umpan balik visual |
| G-3 | Situs tidak terlihat seperti template AI | Memenuhi seluruh larangan pada skill `anti-slop-design` |
| G-4 | Data terverifikasi tidak pernah dipalsukan | Bila registry tidak terjangkau, yang tampil adalah status `offline` beserta alasannya |
| G-5 | Situs dapat dibaca mesin dan manusia dengan disabilitas | Struktur judul benar, kontras memadai, fokus terlihat, `prefers-reduced-motion` dihormati |

Sasaran yang **bukan** tujuan proyek: memaksimalkan jumlah kunjungan, mengumpulkan data pengunjung,
atau menjadi blog.

## 3. Persona

**P1. Arnal, pemilik portofolio (IT Lead / SPV).**
Ingin satu alamat yang bisa dikirim ke perekrut dan calon klien. Perlu bisa memperbarui data
dengan cepat tanpa menyentuh kode komponen. Menolak tampilan yang membuatnya terlihat seperti
kandidat junior.

**P2. Rina, manajer teknik yang menyaring kandidat.**
Punya waktu terbatas. Ingin tahu: berapa besar tim yang pernah dipimpin, sistem seperti apa yang
dijaga, apa yang pernah gagal, dan apakah kandidat jujur soal kelemahannya. Dia skeptis terhadap
angka yang tidak bisa diverifikasi.

**P3. Dimas, perekrut teknis.**
Butuh memastikan sertifikasi masih berlaku, memverifikasi riwayat pekerjaan, dan mengunduh atau
menyalin informasi kontak dengan cepat.

## 4. Ruang Lingkup

**Termasuk:**
- Situs satu halaman tunggal berbasis React dengan delapan rute.
- Visualisasi data karier, proyek, sertifikasi, dan keahlian.
- Tabel interaktif dengan pencarian, filter, dan pengurutan.
- Elemen 3D interaktif di halaman beranda.
- Integrasi baca saja dengan registry keahlian terverifikasi.
- Mode gelap dan terang.
- Data contoh yang siap ditukar dengan data asli.

**Tidak termasuk (sengaja):**
- Backend, basis data, atau API milik sendiri.
- Autentikasi dan akun pengguna.
- Pengiriman formulir kontak ke server.
- Blog, CMS, atau panel admin.
- Analitik pelacak pihak ketiga.

## 5. Requirement Fungsional

Status per 2026-09-14.

### 5.1 Kerangka situs

| Kode | Requirement | Status |
|---|---|---|
| FR-1 | Situs memiliki delapan rute: Beranda, Karier, Proyek, Sertifikasi, Keahlian, Tentang, Kontak, dan halaman 404 untuk alamat tak dikenal | Selesai |
| FR-2 | Perpindahan antar halaman dianimasikan halus, tanpa kedipan atau lompatan posisi gulir | Selesai |
| FR-3 | Setiap halaman memiliki pemisah gulir, penanda posisi, dan tombol kembali ke atas | Selesai |
| FR-4 | Navigasi utama menandai halaman yang sedang aktif | Selesai |
| FR-5 | Mode gelap dan terang dapat ditukar pengguna dan pilihannya diingat | Selesai |

### 5.2 Beranda

| Kode | Requirement | Status |
|---|---|---|
| FR-6 | Beranda menampilkan angka kunci: tahun pengalaman, jumlah orang yang dipimpin, jumlah titik yang dijaga | Selesai |
| FR-7 | Beranda memuat elemen 3D interaktif yang dapat diputar dengan seret kursor dan berotasi otomatis saat diam | Selesai |
| FR-8 | Elemen 3D memberi reaksi visual saat kursor mendekat | Selesai |
| FR-9 | Beranda menampilkan ringkasan jalur karier dan tautan ke halaman lain | Selesai |

### 5.3 Karier

| Kode | Requirement | Status |
|---|---|---|
| FR-10 | Halaman karier menampilkan linimasa peran beserta rentang waktu, tingkat jabatan, dan jumlah bawahan langsung | Selesai |
| FR-11 | Tiap peran memuat ringkasan, pencapaian, dan teknologi yang dipakai | Selesai |
| FR-12 | Tersedia grafik yang memperlihatkan pertumbuhan tanggung jawab antar waktu | Selesai |
| FR-13 | Tersedia tabel riwayat pekerjaan yang dapat dicari, disaring, dan diurutkan | Selesai |

### 5.4 Proyek

| Kode | Requirement | Status |
|---|---|---|
| FR-14 | Tiap proyek memuat jenis, status, peran, teknologi, dan angka dampak | Selesai |
| FR-15 | Tersedia sorotan proyek berdampak tertinggi | Selesai |
| FR-16 | Tersedia visualisasi komposisi proyek menurut jenis dan status | Selesai |
| FR-17 | Tersedia tabel proyek interaktif dengan pencarian, filter, dan pengurutan | Selesai |

### 5.5 Sertifikasi

| Kode | Requirement | Status |
|---|---|---|
| FR-18 | Sertifikasi menampilkan penerbit, bidang, tanggal terbit, tanggal kedaluwarsa, dan nomor kredensial | Selesai |
| FR-19 | Status sertifikasi dibedakan jelas: aktif, kedaluwarsa, sedang diperbarui | Selesai |
| FR-20 | Sertifikasi yang mendekati kedaluwarsa ditandai | Selesai |
| FR-21 | Tersedia visualisasi sebaran bidang sertifikasi dan investasi biaya belajar | Selesai |
| FR-22 | Tersedia tabel sertifikasi interaktif | Selesai |

### 5.6 Keahlian

| Kode | Requirement | Status |
|---|---|---|
| FR-23 | Keahlian dikelompokkan menurut kategori dan dapat disaring | Selesai |
| FR-24 | Tiap keahlian menampilkan tingkat penilaian, masa pakai, tahun terakhir dipakai, dan tautan bukti ke proyek atau sertifikat terkait | Selesai |
| FR-25 | Halaman menandai keahlian yang jarang dipakai dan keahlian dengan bukti tipis | Selesai |
| FR-26 | Tersedia grafik keseimbangan kategori, keahlian teratas, dan sebaran jam terbang | Selesai |
| FR-27 | Halaman menampilkan data dari registry keahlian terverifikasi pihak ketiga | Selesai |
| FR-28 | Bila registry tidak terjangkau, tampilkan status offline beserta alasan dan tombol coba lagi, tanpa angka karangan | Selesai |
| FR-29 | Halaman menjelaskan secara terbuka perbedaan antara penilaian mandiri dan angka registry | Selesai |

### 5.7 Tentang

| Kode | Requirement | Status |
|---|---|---|
| FR-30 | Halaman memuat cara kerja, prinsip kerja, dan data diri | Selesai |
| FR-31 | Halaman memuat kesalahan nyata beserta biayanya | Selesai |
| FR-32 | Halaman memuat daftar hal yang belum selesai | Selesai |
| FR-33 | Halaman memuat tanya jawab, termasuk keterangan bahwa data adalah contoh | Selesai |

### 5.8 Kontak

| Kode | Requirement | Status |
|---|---|---|
| FR-34 | Formulir memiliki validasi di sisi klien untuk nama, surel, dan panjang pesan | Selesai |
| FR-35 | Panjang pesan ditampilkan sebagai indikator kemajuan | Selesai |
| FR-36 | Pesan yang siap dikirim dapat disalin ke papan klip, dengan konfirmasi visual | Selesai |
| FR-37 | Tersedia tautan surel yang sudah terisi subjek dan isi pesan | Selesai |
| FR-38 | Tersedia kanal langsung ke profil profesional | Selesai |
| FR-39 | Halaman menyatakan terbuka bahwa tidak ada server yang menerima pesan | Selesai |

### 5.9 Halaman 404

| Kode | Requirement | Status |
|---|---|---|
| FR-40 | Halaman 404 menampilkan alamat yang salah dan daftar semua rute yang tersedia | Selesai |
| FR-41 | Halaman 404 menyarankan proyek berdampak tertinggi sebagai jalan pintas | Selesai |

### 5.10 Kejujuran data

| Kode | Requirement | Status |
|---|---|---|
| FR-42 | Seluruh isi portofolio berasal dari satu berkas data sehingga mudah ditukar dengan riwayat asli | Selesai |
| FR-43 | Situs tidak menampilkan angka verifikasi apa pun yang tidak berasal dari sumber nyata | Selesai |

## 6. Requirement Non Fungsional

| Kode | Requirement | Status | Catatan |
|---|---|---|---|
| NFR-1 | Kode lolos pemeriksaan tipe TypeScript dalam mode ketat tanpa error | Selesai | `strict`, `noUnusedLocals`, `noUnusedParameters` aktif |
| NFR-2 | Build produksi berhasil tanpa error | Selesai | Diverifikasi 2026-09-14 |
| NFR-3 | Ukuran bundle awal wajar untuk situs portofolio | **Sebagian** | Saat ini 1.98 MB mentah, 558 kB gzip. Belum dipecah. Lihat bagian 12 |
| NFR-4 | Mendukung `prefers-reduced-motion` | Selesai | Dipakai pada efek kursor dan animasi masuk |
| NFR-5 | Fokus papan tuntas terlihat pada semua elemen interaktif | Selesai | Aturan `:focus-visible` global |
| NFR-6 | Tidak ada gulir horizontal pada lebar layar berapa pun | Selesai | `overflow-x: hidden` pada `body` |
| NFR-7 | Tabel dan kontrol dinamis memakai atribut aksesibilitas yang benar | Selesai | `aria-sort`, `aria-label`, `role`, `aria-invalid`, `aria-describedby` |
| NFR-8 | Teks antarmuka tidak memakai tanda pisah panjang (em-dash) | Selesai | Aturan pada skill `anti-slop-design` |
| NFR-9 | Situs dapat dipakai tanpa JavaScript untuk membaca konten inti | **Belum** | Situs dirender sepenuhnya di sisi klien. Tidak direncanakan dalam waktu dekat |
| NFR-10 | Pemanggilan jaringan ke registry tidak memblokir tampilan halaman | Selesai | Cache 6 jam, status pemuatan terpisah |
| NFR-11 | Seluruh teks antarmuka memakai Bahasa Indonesia | Selesai | |

## 7. Requirement Teknis dan Teknologi

Requirement asli dari pemilik produk beserta keadaan nyatanya.

| Kode | Diminta | Keadaan nyata | Status |
|---|---|---|---|
| TR-1 | Tailwind CSS dengan tema kustom yang unik, bukan template standar | Tailwind 3.4 dengan palet kustom `ink`, `rust`, `moss`, radius `blob` dan `notch`, bayangan `lift` dan `rust-glow`, keyframes khusus | Selesai |
| TR-2 | shadcn/ui untuk komponen, dengan tampilan yang disesuaikan | 12 komponen pola shadcn (Radix + CVA + `cn`) di `src/components/ui/`, sudah disesuaikan dengan token proyek | Selesai |
| TR-3 | Recharts untuk visualisasi data | Recharts 2.15 dipakai pada karier, proyek, sertifikasi, dan keahlian, dibungkus komponen `ChartFrame` bersama | Selesai |
| TR-4 | TanStack Table untuk tabel interaktif dengan filter, sort, dan pencarian | TanStack Table 8.21 dengan komponen generik `DataTable` dan tiga tabel konkret | Selesai |
| TR-5 | Komponen dari uiverse.io | **Tidak ada komponen uiverse.io yang dipakai.** Unsur visual khas diimplementasikan sendiri (aura kursor, kartu sorot, teks bergaris, panel bertanda) agar selaras dengan tema | **Ditunda** |
| TR-6 | Framer Motion untuk animasi halaman dan antar elemen | Framer Motion 12, dengan komponen `Reveal`, `RevealGroup`, `RevealItem`, `SplitHeading`, `Counter`, dan transisi halaman `PageShell` | Selesai |
| TR-7 | Integrasi data keahlian dari tasteskill.dev | Klarifikasi penting: tasteskill.dev bukan penyedia API data keahlian, melainkan kumpulan berkas SKILL.md. API nyata yang dipakai adalah `verified-skill.com/api/v1` | **Sebagian** |
| TR-8 | Elemen 3D interaktif yang dapat diputar dan bereaksi terhadap kursor | `HeroScene` dengan `@react-three/fiber` dan `three`, mendukung seret, rotasi otomatis, dan reaksi hover. `@react-three/drei` sengaja tidak dipakai | Selesai |
| TR-9 | Situs sangat interaktif dengan umpan balik visual pada setiap aksi | Terpenuhi pada tombol, kartu, tabel, formulir, tab, akordeon, dan elemen 3D. Belum ada audit sistematis | **Sebagian** |
| TR-10 | Menyajikan informasi komprehensif tentang pengalaman dan keahlian | Delapan halaman dengan data karier, proyek, sertifikasi, keahlian, prinsip, kegagalan, dan tanya jawab | Selesai |

### Catatan TR-5

Pemilik produk meminta komponen tambahan dari uiverse.io untuk menambah keunikan antarmuka.
Pada implementasi awal, unsur keunikan dibuat sendiri agar tetap konsisten dengan tema.
Bila pemilik produk ingin komponen uiverse.io benar benar dipakai, komponen tersebut harus
diportel ke pola token proyek, bukan disalin apa adanya, dan dicatat sebagai penambahan fitur baru di PRD ini.

### Catatan TR-7

Rancangan semula adalah menampilkan kompetensi dari data yang dikelola oleh penyedia eksternal.
Setelah ditelusuri, `tasteskill.dev` mengarah ke kumpulan berkas `SKILL.md` untuk agen AI,
bukan layanan profil keahlian. Registry yang benar benar menyediakan API verifikasi adalah
`verified-skill.com`. Karena itu integrasi dialihkan ke sana, dan halaman Keahlian memuat
panel penjelasan agar pengunjung tidak salah paham.

## 8. Arsitektur Informasi

| Rute | Halaman | Tugas utama halaman |
|---|---|---|
| `/` | Beranda | Meyakinkan dalam sepuluh detik, menampilkan skala tanggung jawab |
| `/karier` | Karier | Menunjukkan pertumbuhan jabatan dan besarnya tanggung jawab |
| `/proyek` | Proyek | Membuktikan dampak nyata, bukan daftar teknologi |
| `/sertifikasi` | Sertifikasi | Membuktikan kompetensi formal dan kemutakhirannya |
| `/keahlian` | Keahlian | Menunjukkan sebaran kemampuan, dengan pembedaan jujur antara klaim dan bukti |
| `/tentang` | Tentang | Menunjukkan cara berpikir, prinsip, dan kejujuran soal kegagalan |
| `/kontak` | Kontak | Memudahkan menghubungi, tanpa janji palsu soal pengiriman pesan |
| `*` | 404 | Mengembalikan pengunjung ke jalur yang benar |

## 9. Model Data

Seluruh data berada di `src/data/portfolio.ts` sebagai sumber tunggal.

- **`Role`** (karier): `id`, `title`, `company`, `sector`, `location`, `start`, `end`, `level` (`IC`/`Lead`/`SPV`/`Manager`), `headcount`, `summary`, `highlights[]`, `stack[]`.
- **`Project`**: `id`, `name`, `kind`, `status`, `role`, `year`, teknologi, dampak, dan metrik pendukung.
- **`Certification`**: `id`, `name`, `issuer`, `domain`, `issued`, `expires`, `credentialId`, `status`, `cost`.
- **`Skill`**: `id`, `name`, `category`, `level`, `years`, `lastUsed`, `evidence[]`.
  Kolom `evidence` merujuk ke id proyek, sertifikat, atau peran, sehingga tiap klaim keahlian dapat ditelusuri.
- **`profile`**: identitas, ringkasan, lokasi, zona waktu, surel, dan tautan profesional.
- **`principles`**: prinsip kerja sebagai blok editorial.

Relasi kunci: keahlian ke bukti adalah relasi yang membuat halaman Keahlian bisa menuntut
pertanggungjawaban, dan sekaligus menandai klaim yang buktinya tipis.

## 10. Desain dan Bahasa Visual

Arah desain: **"Rust & Ink"**. Dasar tinta hangat, aksen karat dan lumut, kesan dokumen kerja
lapangan yang padat dan jujur. Bukan landing page SaaS, bukan templat portofolio tiga kolom.

Aturan mengikat dan daftar larangan lengkap ada pada skill `anti-slop-design`.
Ringkasnya:

- Warna hanya dari token proyek, tidak ada nilai warna baru di dalam komponen.
- Tiga peran tipografi: Bricolage Grotesque untuk judul, Inter untuk badan, JetBrains Mono untuk angka dan label.
- Identitas visual diulang secara konsisten: panel bertanda garis aksen, latar kisi, teks bergaris, label kecil gaya mesin.
- Easing baku `cubic-bezier(0.16, 1, 0.3, 1)`, durasi 0.2 sampai 0.45 detik.
- Dilarang: em-dash pada teks yang terlihat, gradien ungu-biru khas template AI, grid kartu seragam, emoji, dan teks pemasaran tanpa angka.

## 11. Status Implementasi

Ringkasan per 2026-09-14.

| Kelompok | Jumlah | Selesai | Sebagian | Belum / Ditunda |
|---|---|---|---|---|
| Fungsional (FR) | 43 | 43 | 0 | 0 |
| Non fungsional (NFR) | 11 | 9 | 1 | 1 |
| Teknis (TR) | 10 | 6 | 3 | 1 |

Yang sudah diverifikasi langsung: `tsc --noEmit` tanpa error, `npm run build` berhasil,
dev server merespons HTTP 200, dan seluruh delapan halaman ada di dalam repositori.

## 12. Batasan dan Utang Teknis

1. **Seluruh data adalah contoh.** Karier, proyek, sertifikasi, dan keahlian harus diganti dengan
   riwayat asli sebelum situs dipublikasikan. Struktur data sudah dirancang agar penggantian ini
   tidak menyentuh komponen.
2. **Ukuran bundle.** Berkas JavaScript awal berukuran sekitar 1.98 MB (558 kB gzip), memicu
   peringatan Vite. Penyebab utamanya `three` dan `recharts` yang ikut pada bundle awal padahal
   hanya dipakai sebagian halaman. Perbaikan yang disarankan adalah pemecahan kode dengan
   `React.lazy` dan `manualChunks`. Belum dikerjakan karena belum menjadi prioritas.
3. **Tidak ada backend.** Formulir kontak tidak mengirim data ke mana pun. Ini disampaikan
   secara terbuka di antarmuka, dan bukan cacat yang perlu ditutup.
4. **Integrasi registry bergantung pihak ketiga.** Bila API berubah bentuk atau ditutup,
   halaman Keahlian akan menampilkan status offline. Tidak ada penjadwalan ulang otomatis
   selain tombol coba lagi.
5. **Belum ada pengujian otomatis.** Tidak ada uji unit maupun uji ujung ke ujung.
   Verifikasi masih manual melalui pemeriksaan tipe, build, dan pemeriksaan di browser.
6. **Recharts 2.15 sudah ditandai kedaluwarsa** oleh pengelolanya. Migrasi ke versi 3 akan
   mengubah sebagian API dan perlu dikerjakan sebagai tugas tersendiri.
7. **Render di sisi klien saja.** Mesin pencari modern umumnya masih dapat membaca situs ini,
   tetapi tidak ada prasajian atau pemuatan awal untuk konten di luar JavaScript.

## 13. Risiko dan Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Data contoh terbawa ke produksi | Kredibilitas hancur, isi tidak benar | Menandai data contoh di antarmuka dan di komentar berkas data. Wajib diganti sebelum publikasi |
| API registry ditutup atau berubah | Halaman Keahlian menampilkan status offline | Cacah 6 jam, penanganan gagal yang jujur, tombol coba lagi, dan penjelasan status |
| Menambah fitur tanpa memperbarui PRD | Dokumen dan kode saling bertentangan | Skill `prd-guardian` mewajibkan pencatatan |
| Tampilan menyimpang dari tema | Situs kembali terlihat generik | Skill `anti-slop-design` memuat daftar larangan dan daftar periksa |
| Ketergantungan pada pustaka animasi dan 3D yang besar | Bundle membengkak, waktu muat naik | Pemecahan kode menjadi utang teknis yang tercatat |
| Kelas CSS yang tidak ada dipakai | Tampilan rusak tanpa pesan error | Skill `project-map` memuat daftar lengkap kelas komponen yang tersedia |

## 14. Di Luar Ruang Lingkup

Daftar ini menjelaskan hal yang sengaja tidak dikerjakan, agar tidak menimbulkan harapan keliru.

1. Backend, basis data, dan API milik sendiri.
2. Autentikasi dan akun pengguna.
3. Pengiriman formulir ke surel atau layanan pihak ketiga secara otomatis.
4. Blog atau artikel teknis.
5. Panel admin untuk mengelola data melalui antarmuka.
6. Dukungan banyak bahasa. Situs ini hanya berbahasa Inggris, tanpa lapisan i18n.
7. Analitik, pelacak, dan kuki pemasaran.
8. Berbagi otomatis ke media sosial.

## 15. Riwayat Perubahan

### 2026-09-14

- **PRD-1 Ditambahkan**: dokumen PRD ini dibuat sebagai sumber kebenaran requirement.
  - Kebutuhan: permintaan pemilik produk agar seluruh requirement beserta penambahan fitur berikutnya tercatat di satu dokumen.
  - Perubahan kode: tidak ada, dokumen saja.
  - Status: Selesai.
- **FR-1 sampai FR-43 dan NFR-1 sampai NFR-11 Dicatat**: hasil implementasi awal delapan halaman direkam beserta statusnya.
  - Perubahan kode: seluruh berkas di `src/` sudah ada sebelum pencatatan ini.
  - Status: Selesai, kecuali butir yang ditandai Sebagian atau Belum pada bagian 11.
- **NFR-8 Diterapkan**: tanda pisah panjang pada teks yang terlihat pengguna dihapus.
  - Perubahan kode: `src/lib/utils.ts` pada `monthRange()`, `src/data/portfolio.ts` pada `profile.tagline`, dan `index.html` pada `title` serta meta description.
  - Status: Selesai.
- **TR-7 Diklarifikasi**: `tasteskill.dev` bukan penyedia API data keahlian. Integrasi dialihkan ke `verified-skill.com/api/v1`.
  - Perubahan kode: `src/lib/tasteskill.ts` dan `src/hooks/useVerifiedSkills.ts`.
  - Status: Sebagian. Data sudah diambil dari sumber nyata, tetapi pemetaan ke kemampuan profesional masih memakai daftar statis berisi empat area.
- **TR-5 Ditunda**: komponen dari uiverse.io tidak dipakai. Unsur keunikan dibuat sendiri agar selaras dengan tema.
  - Status: Ditunda, menunggu keputusan pemilik produk.
- **Perkakas agen Ditambahkan**: empat skill dibuat di `.trae/skills/`.
  - `project-map`: peta berkas, ekspor, prop, dan model data agar agen tidak berulang kali membaca kode.
  - `anti-slop-design`: aturan visual dan daftar larangan.
  - `prd-guardian`: kewajiban mencatat perubahan fitur ke PRD ini.
  - `verify-before-done`: langkah verifikasi tipe, build, dan runtime sebelum menyatakan tugas selesai.
  - Status: Selesai.

### 2026-09-14 (lanjutan)

- **NFR-11 Diterapkan**: seluruh teks antarmuka, pesan sistem, notifikasi, dan konten default dialihkan ke Bahasa Inggris.
  - Keputusan pemilik produk: situs satu bahasa. Bahasa Inggris adalah bahasa default, bukan hasil terjemahan, dan tidak ada lapisan i18n.
  - Perubahan kode: seluruh berkas di `src/`.
    - `index.html`: `lang="id"` menjadi `lang="en"`.
    - `src/lib/utils.ts`: locale angka `id-ID` menjadi `en-US`; `monthRange()` menghasilkan `"Mar 2021 to Now"`.
    - `src/data/portfolio.ts`: nilai union diterjemahkan, yaitu `ProjectStatus` menjadi `"live" | "active" | "completed" | "on-hold"`, `ProjectKind` menjadi `"Infrastructure" | "Internal Systems" | "Integration" | "Security" | "Data & Monitoring" | "ERP Rollout"`, status sertifikat menjadi `"active" | "expired" | "renewing"`, dan kategori skill menjadi `"Leadership" | "Infrastructure" | "Engineering" | "Security" | "Data" | "Operations"`.
    - `src/lib/tasteskill.ts`: `relevance` menjadi `"direct" | "supporting"`.
    - Rute diubah: `/karier` menjadi `/career`, `/proyek` menjadi `/projects`, `/sertifikasi` menjadi `/credentials`, `/keahlian` menjadi `/skills`, `/tentang` menjadi `/about`, `/kontak` menjadi `/contact`. Rute lama tidak disediakan sebagai pengalihan.
    - Delapan halaman, seluruh komponen `layout`, `charts`, `tables`, `fx`, `ui`, serta komentar di `src/index.css` ikut diterjemahkan. Tanda pisah panjang tetap dihindari pada seluruh teks yang terlihat pengguna.
  - Verifikasi: `npx tsc --noEmit` keluar tanpa galat, `npm run build` berhasil, `dist/` dibangun ulang dengan `lang="en"`, dan penyisiran kata Bahasa Indonesia di `src/` bersih.
  - Status: Selesai.
