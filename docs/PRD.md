# PRD: Situs Portofolio Profesional Arnal Putra

**Pemilik produk:** Arnal Putra
**Peran yang ditargetkan:** IT Lead / Supervisor (Head of IT)
**Versi dokumen:** 1.1
**Terakhir diperbarui:** 2026-09-15
**Status produk:** Implementasi awal selesai, panel admin berjalan, entri portofolio dapat dikelola sendiri, siap diisi data asli

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
- Situs satu halaman tunggal berbasis React dengan delapan rute publik.
- Panel admin di `/admin` untuk menyunting teks situs, hanya untuk akun yang terdaftar.
- Visualisasi data karier, proyek, sertifikasi, dan keahlian.
- Tabel interaktif dengan pencarian, filter, dan pengurutan.
- Elemen 3D interaktif di halaman beranda.
- Integrasi baca saja dengan registry keahlian terverifikasi.
- Mode gelap dan terang.
- Data contoh yang siap ditukar dengan data asli.
- Pengiriman formulir kontak ke server: pesan disimpan lebih dulu, lalu surel notifikasi dikirim.

**Tidak termasuk (sengaja):**
- Blog atau CMS penuh dengan media dan tata letak bebas.
- Analitik pelacak pihak ketiga.
- Pendaftaran akun mandiri. Akun admin hanya dibuat melalui SQL di dashboard Supabase.

Revisi 2026-09-15: batasan "tanpa backend" dan "tanpa autentikasi" dicabut. Panel admin
memakai Supabase sebagai penyimpan teks dan Supabase Auth untuk masuk. Keputusan dan
konsekuensinya dicatat pada changelog di bagian 15.

Revisi 2026-09-16: batasan "tanpa pengiriman formulir kontak ke server" dicabut. Formulir
kontak mengirim langsung ke titik akhir server yang menyimpan pesan ke basis data, lalu
mengirim surel notifikasi bertema situs ke pemilik. Tautan surel yang sudah terisi subjek
dan isi pesan tidak lagi dipakai.

## 5. Requirement Fungsional

Status per 2026-09-15.

### 5.1 Kerangka situs

| Kode | Requirement | Status |
|---|---|---|
| FR-1 | Situs memiliki delapan rute: Beranda, Karier, Proyek, Sertifikasi, Keahlian, Tentang, Kontak, dan halaman 404 untuk alamat tak dikenal | Selesai |
| FR-2 | Perpindahan antar halaman dianimasikan halus, tanpa kedipan atau lompatan posisi gulir | Selesai |
| FR-3 | Setiap halaman memiliki pemisah gulir, penanda posisi, dan tombol kembali ke atas | Selesai |
| FR-4 | Navigasi utama menandai halaman yang sedang aktif | Selesai |
| FR-5 | Mode gelap dan terang dapat ditukar pengguna dan pilihannya diingat | Selesai |
| FR-74 | Kursor bawaan diganti reticle bernuansa teknis yang warnanya mengikuti tema, menempel pada pointer, mengecil saat terkunci pada sasaran dan saat ditekan, serta menampilkan label mono berisi jenis sasaran. Kolom teks tetap memakai kursor teks, dan reticle mati bila pengguna meminta gerak dikurangi | Selesai |

### 5.2 Beranda

| Kode | Requirement | Status |
|---|---|---|
| FR-6 | Beranda menampilkan angka kunci: tahun pengalaman, jumlah orang yang dipimpin, jumlah titik yang dijaga | Selesai |
| FR-7 | Beranda memuat elemen 3D interaktif yang dapat diputar dengan seret kursor dan berotasi otomatis saat diam | Selesai |
| FR-8 | Elemen 3D memberi reaksi visual saat kursor mendekat | Selesai |
| FR-9 | Beranda menampilkan ringkasan jalur karier dan tautan ke halaman lain | Selesai |
| FR-75 | Isi strip berjalan di Beranda dan di footer dapat disunting dari registry konten sebagai daftar satu item per baris. Strip Beranda memakai daftar itu bila diisi, dan tetap mengikuti riwayat pekerjaan bila dibiarkan kosong | Selesai |

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
| FR-37 | Formulir mengirim langsung ke titik akhir server. Pesan disimpan ke basis data lebih dulu, lalu surel notifikasi dikirim, sehingga pengunjung tidak pernah diberi tahu "terkirim" bila satu satunya salinan hilang | Selesai |
| FR-38 | Tersedia kanal langsung ke profil profesional | Selesai |
| FR-39 | Halaman menyatakan terbuka ke mana pesan pergi dan urutan simpan lalu kirim, bukan menjanjikan hal yang tidak dilakukan | Selesai |
| FR-76 | Surel notifikasi ke pemilik memakai template bertema situs (Rust & Ink): garis aksen, label mono, blok pengirim, blok pesan, dan footer, dengan balasan langsung ke surel pengunjung lewat `reply_to` | Selesai |
| FR-77 | Titik akhir publik menolak permintaan selain `POST` dan isi yang tidak lolos validasi, serta tidak pernah menulis langsung ke tabel karena penulisan lewat fungsi `security definer` | Selesai |
| FR-78 | Pengiriman dibatasi kuota di basis data: 5 pesan per jam per surel dan 60 pesan per jam secara keseluruhan | Selesai |
| FR-79 | Panel admin memiliki tab Inbox untuk membaca, menandai sudah dibaca, dan menghapus pesan yang masuk | Selesai |

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

### 5.11 Panel admin

| Kode | Requirement | Status |
|---|---|---|
| FR-44 | Panel admin hanya dapat dibuka oleh akun yang alamat surelnya terdaftar pada daftar izin di basis data | Selesai |
| FR-45 | Masuk memakai nama pengguna dan kata sandi. Nama pengguna dipetakan ke surel di sisi klien, karena Supabase Auth hanya mengenal surel | Selesai |
| FR-46 | Akun yang baru dibuat wajib mengganti kata sandi sebelum dapat memakai panel, dan kewajiban itu ditentukan oleh basis data, bukan oleh peramban | Selesai |
| FR-47 | Kata sandi baru minimal 12 karakter, tidak sama dengan kata sandi sekarang, dan harus diketik dua kali | Selesai |
| FR-48 | Pemilik dapat menyunting setiap teks yang ada di registry konten, dikelompokkan per halaman dan per seksi | Selesai |
| FR-49 | Ketikan ditahan di peramban sampai pemilik menekan simpan, sehingga kalimat setengah jadi tidak pernah masuk basis data | Selesai |
| FR-50 | Draf dapat disimpan, dibuang per halaman, atau dibuang seluruhnya | Selesai |
| FR-51 | Halaman publik hanya berubah setelah pemilik menekan terbit. Sebelum itu, draf hanya terlihat oleh pemilik melalui mode pratinjau | Selesai |
| FR-52 | Setiap penerbitan menyimpan nilai sebelumnya, sehingga setiap perubahan dapat dikembalikan | Selesai |
| FR-53 | Panel menampilkan daftar revisi dengan tombol kembalikan, dan catatan aktivitas berisi pelaku, aksi, sasaran, dan waktu | Selesai |
| FR-54 | Panel menyatakan terus terang batas kemampuannya: hanya teks registry yang bisa disunting, tidak ada situs staging, dan pratinjau hanya berlaku pada peramban pemilik | Selesai |
| FR-55 | Tidak ada jalur di antarmuka untuk menambah atau menghapus admin. Daftar izin hanya berubah lewat SQL | Selesai |
| FR-56 | Kata sandi dapat diganti kapan saja dari panel, dengan meminta kata sandi sekarang terlebih dahulu | Selesai |
| FR-57 | Kegagalan wewenang dari basis data ditampilkan sebagai pesan yang menyuruh masuk ulang, bukan sebagai pesan galat mentah | Selesai |
| FR-71 | Foto profil dapat diunggah langsung dari tab Content, disimpan pada bucket `portfolio-media` di folder `profile/`, dan tampil di samping teks hero Beranda dengan bingkai bernuansa karat | Selesai |
| FR-72 | Seluruh halaman (Karier, Proyek, Sertifikasi, Keahlian, Tentang, Kontak, dan 404) membaca judul, lead, label statistik, dan judul seksinya dari registry konten, bukan dari teks yang dipatri di dalam komponen | Selesai |
| FR-73 | Kartu detail node 3D pada Beranda muncul dan hilang dengan animasi yang sama durasinya, tertutup otomatis saat node lain diklik (kartu baru menunggu kartu lama selesai menutup), tertutup saat klik kiri di luar area kluster, dan tertutup lewat tombol tutup | Selesai |

### 5.12 Pengelolaan entri portofolio

Tab **Entries** pada panel admin. Berbeda dari penyunting teks pada 5.11, entri ditulis langsung ke tabelnya dan tidak melewati alur draf lalu terbit.

| Kode | Requirement | Status |
|---|---|---|
| FR-58 | Panel menyediakan tab terpisah untuk mengelola entri, berisi empat daftar: riwayat pekerjaan, proyek, sertifikasi, dan keahlian | Selesai |
| FR-59 | Pemilik dapat menambah, mengubah, dan menghapus entri pada keempat daftar tersebut, tanpa batas jumlah | Selesai |
| FR-60 | Setiap entri memiliki sakelar tampil. Entri yang disembunyikan hilang dari halaman publik tanpa ikut terhapus | Selesai |
| FR-61 | Urutan entri pada halaman publik mengikuti urutan yang ditetapkan pemilik di panel | Selesai |
| FR-62 | Formulir menolak nilai di luar batas yang dijaga basis data, sehingga galat batas tidak pernah sampai ke pengguna sebagai pesan mentah | Selesai |
| FR-63 | Setiap sertifikat dapat memiliki beberapa gambar scan, diunggah dari formulir sertifikat | Selesai |
| FR-64 | Scan dapat diurutkan ulang dan dihapus. Menghapus scan juga menghapus berkasnya di Storage | Selesai |
| FR-65 | Halaman Credentials menampilkan seluruh scan dalam slideshow layar penuh, dikelompokkan per sertifikat | Selesai |
| FR-66 | Slideshow dapat ditelusuri dengan papan tik dan menutup dengan tombol Escape, serta mengembalikan fokus ke elemen pemanggilnya | Selesai |
| FR-67 | Selama sebuah daftar belum pernah diisi, halaman publik menampilkan entri contoh agar halaman tidak terlihat rusak. Setelah entri pertama disimpan, daftar itu sepenuhnya memakai isi basis data | Selesai |
| FR-68 | Daftar yang sengaja dikosongkan pemilik tetap tampil kosong, tidak diisi kembali dengan entri contoh | Selesai |
| FR-69 | Seluruh penulisan entri dan gambar melewati fungsi `security definer` yang memeriksa daftar izin di basis data, dan ditolak dengan `42501` bila pemanggil bukan admin | Selesai |
| FR-70 | Unggahan gambar dibatasi di sisi klien dengan batas yang sama seperti yang dijaga Storage, dan berkas yang gagal disimpan barisnya tidak ditinggalkan di Storage | Selesai |

## 6. Requirement Non Fungsional

| Kode | Requirement | Status | Catatan |
|---|---|---|---|
| NFR-1 | Kode lolos pemeriksaan tipe TypeScript dalam mode ketat tanpa error | Selesai | `strict`, `noUnusedLocals`, `noUnusedParameters` aktif |
| NFR-2 | Build produksi berhasil tanpa error | Selesai | Diverifikasi 2026-09-14 |
| NFR-3 | Ukuran bundle awal wajar untuk situs portofolio | **Sebagian** | Per build 2026-09-15: 2.33 MB mentah, 644 kB gzip. Naik dari 1.98 MB setelah klien Supabase masuk. Belum dipecah. Lihat bagian 12 |
| NFR-4 | Mendukung `prefers-reduced-motion` | Selesai | Dipakai pada efek kursor dan animasi masuk |
| NFR-5 | Fokus papan tuntas terlihat pada semua elemen interaktif | Selesai | Aturan `:focus-visible` global |
| NFR-6 | Tidak ada gulir horizontal pada lebar layar berapa pun | Selesai | `overflow-x: hidden` pada `body` |
| NFR-7 | Tabel dan kontrol dinamis memakai atribut aksesibilitas yang benar | Selesai | `aria-sort`, `aria-label`, `role`, `aria-invalid`, `aria-describedby` |
| NFR-8 | Teks antarmuka tidak memakai tanda pisah panjang (em-dash) | Selesai | Aturan pada skill `anti-slop-design` |
| NFR-9 | Situs dapat dipakai tanpa JavaScript untuk membaca konten inti | **Belum** | Situs dirender sepenuhnya di sisi klien. Tidak direncanakan dalam waktu dekat |
| NFR-10 | Pemanggilan jaringan ke registry tidak memblokir tampilan halaman | Selesai | Cache 6 jam, status pemuatan terpisah |
| NFR-11 | Seluruh teks antarmuka memakai satu bahasa, yaitu Bahasa Inggris, tanpa lapisan i18n | Selesai | Semula tertulis Bahasa Indonesia, lalu diubah pemilik. Catatan perubahannya ada pada bagian 15 |
| NFR-12 | Basis data menolak semua akses secara bawaan: row level security aktif pada setiap tabel, dan tabel tanpa policy tidak dapat dibaca maupun ditulis | Selesai | Terverifikasi 2026-09-15 |
| NFR-13 | Setiap penulisan konten lewat fungsi `security definer` yang memeriksa ulang daftar izin di dalam basis data, sehingga tidak dapat dilewati dengan menyunting berkas bawaan | Selesai | Fungsi mengembalikan galat `42501` bila pemanggil bukan admin |
| NFR-14 | Kunci yang dipublikasikan hanya kunci yang aman dipublikasikan. Tidak ada service role key di dalam repositori maupun di dalam berkas bawaan | Selesai | Terverifikasi 2026-09-15 |
| NFR-15 | Permintaan tanpa sesi ditolak, dan penolakan diuji ulang setelah setiap perubahan fungsi | Selesai | Uji anon pada `portfolio_admin_state` dan `portfolio_save_draft` mengembalikan 401 |
| NFR-16 | Setiap jawaban HTTP membawa header keamanan: `Content-Security-Policy`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Strict-Transport-Security`, dan `Permissions-Policy` | Selesai | Ditulis pada kunci `headers` di `vercel.json`. Kebijakan itu hanya berlaku sebagai header jawaban, bukan sebagai `<meta>`. Diverifikasi 2026-09-16 |
| NFR-17 | Tidak ada HTML mentah dari data mana pun yang dirender sebagai markup | Selesai | Tidak ada `dangerouslySetInnerHTML`, `innerHTML`, `eval`, maupun `new Function` di `src/`. React meloloskan seluruh teks |

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
| TR-8 | Elemen 3D interaktif yang dapat diputar dan bereaksi terhadap kursor | `HeroScene` dengan `@react-three/fiber` dan `three`, mendukung seret, rotasi otomatis, dan reaksi hover. Ukuran node dijaga cukup besar agar mudah diklik, dan tetap membesar mengikuti tingkat penguasaan. Rotasi otomatis dibekukan selama kursor berhenti di atas sebuah node agar klik selalu mengenai node yang dituju. `@react-three/drei` sengaja tidak dipakai | Selesai |
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
| `/admin/login` | Masuk admin | Satu satunya jalan masuk panel, sekaligus tempat wajib ganti kata sandi pertama kali |
| `/admin/forgot-password` | Lupa sandi admin | Permintaan link pemulihan sandi via email yang terdaftar di allowlist |
| `/admin/reset-password` | Reset sandi admin | Mengubah kata sandi setelah membuka token tautan pemulihan dari email |
| `/admin` | Panel admin | Menyunting, menerbitkan, dan mengembalikan teks situs |

Rute `/admin` dilindungi di sisi klien oleh `RequireAdmin`. Perlindungan yang sebenarnya tetap
ada di basis data: antarmuka yang tersembunyi tidak pernah dianggap sebagai kontrol keamanan.

## 9. Model Data

Seluruh data portofolio publik berada di `src/data/portfolio.ts` sebagai sumber tunggal.

- **`Role`** (karier): `id`, `title`, `company`, `sector`, `location`, `start`, `end`, `level` (`IC`/`Lead`/`SPV`/`Manager`), `headcount`, `summary`, `highlights[]`, `stack[]`.
- **`Project`**: `id`, `name`, `kind`, `status`, `role`, `year`, teknologi, dampak, dan metrik pendukung.
- **`Certification`**: `id`, `name`, `issuer`, `domain`, `issued`, `expires`, `credentialId`, `status`, `cost`.
- **`Skill`**: `id`, `name`, `category`, `level`, `years`, `lastUsed`, `evidence[]`.
  Kolom `evidence` merujuk ke id proyek, sertifikat, atau peran, sehingga tiap klaim keahlian dapat ditelusuri.
- **`profile`**: identitas, ringkasan, lokasi, zona waktu, surel, dan tautan profesional.
- **`principles`**: prinsip kerja sebagai blok editorial.

### Teks yang dapat disunting

Teks yang dapat disunting pemilik tinggal di Supabase, bukan di berkas data. Semuanya berupa
pasangan kunci dan nilai bertipe teks, dengan kunci yang sama seperti registry di
`src/content/registry.ts`. Registry itu sendiri dirakit dari satu berkas per halaman
(`global.ts`, `home.ts`, `career.ts`, `projects.ts`, `credentials.ts`, `skills.ts`, `about.ts`,
`contact.ts`, `notfound.ts`), sehingga menambah teks baru berarti menambah entri pada berkas
halaman yang bersangkutan lalu membacanya lewat `useSiteText()` di komponen.

Foto profil bukan pasangan kunci dan nilai teks biasa: yang disimpan pada kunci
`global.profile.avatar` hanya path berkasnya, sedangkan berkasnya sendiri berada di bucket
Storage `portfolio-media` pada folder `profile/`. Komponen yang menampilkan gambar memilih
antara URL penuh dan `publicImageUrl(path)`.

Kunci dengan penanda `multiline` dirender sebagai kotak teks, dan dua di antaranya menyimpan
daftar: satu item per baris, dibaca komponen dengan `split("\n")`. Itu cara strip berjalan di
Beranda (`home.stack.marquee`) dan di footer (`footer.rollingStrip`) disunting tanpa mengubah
kode.

| Tabel | Isi | Akses |
|---|---|---|
| `portfolio_content` | Nilai yang sudah diterbitkan dan sedang tampil di situs publik | Baca publik, tulis hanya lewat fungsi |
| `portfolio_drafts` | Nilai yang belum diterbitkan | Hanya admin, lewat fungsi |
| `portfolio_revisions` | Riwayat nilai yang digantikan tiap penerbitan dan pengembalian | Baca oleh admin, tulis hanya lewat fungsi |
| `portfolio_activity` | Catatan aksi: pelaku, aksi, sasaran, rincian, waktu | Baca oleh admin, tulis hanya lewat fungsi |
| `portfolio_admins` | Daftar izin berupa alamat surel, catatan, dan penanda wajib ganti kata sandi | Tidak dapat dibaca maupun ditulis lewat API |

Nilai yang tidak ada di `portfolio_content` jatuh ke teks bawaan yang ikut dikompilasi ke dalam
bundel. Jadi situs tetap utuh walaupun basis data kosong atau tidak dapat dijangkau.

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

Ringkasan per 2026-09-15.

| Kelompok | Jumlah | Selesai | Sebagian | Belum / Ditunda |
|---|---|---|---|---|
| Fungsional (FR) | 70 | 70 | 0 | 0 |
| Non fungsional (NFR) | 15 | 13 | 1 | 1 |
| Teknis (TR) | 10 | 6 | 3 | 1 |

Catatan: FR-50 baru benar benar terpakai setelah tombol `Discard all` ditambahkan pada revisi ini.
Sebelumnya kemampuan itu hanya ada di lapisan data.

Yang sudah diverifikasi langsung: `npx tsc -b` keluar dengan 0 error, `npm run build` berhasil, dan dev server menjawab HTTP 200 untuk `/`, `/admin/login`, serta `/admin`.

Yang **belum** diverifikasi: alur panel admin dengan klik sungguhan di peramban, termasuk tab Entries
dan unggahan berkas gambar sungguhan. Yang sudah diuji adalah lapisan data terhadap project Supabase
yang sebenarnya, ditambah pemeriksaan tipe dan build. Membaca kode tidak sama dengan menekan
tombolnya, jadi butir 9 pada bagian 12 masih terbuka.

Uji jalur tulis 2026-09-15, dijalankan terhadap project nyata, bukan tiruan:

1. Masuk dengan `arnal@steadbyte.com` menghasilkan sesi yang sah.
2. `portfolio_admin_state` menjawab `must_change_password: true` untuk akun itu.
3. Permintaan tanpa sesi ditolak 401 pada `portfolio_admin_state` maupun `portfolio_save_draft`.
4. Simpan draf, terbitkan, dan kembalikan berjalan berurutan dan mengembalikan angka yang benar.
5. Setelah pengembalian, baris `portfolio_content` benar benar hilang sehingga situs kembali ke teks bawaan.
6. Pembuangan seluruh draf berhasil, yang sekaligus membuktikan perbaikan galat `21000` masih berlaku.

## 12. Batasan dan Utang Teknis

1. **Data masih kosong.** Keempat tabel entri belum diisi, sehingga halaman publik masih menampilkan
   entri contoh yang ikut ter-bundel. Situs belum boleh dipublikasikan sebelum pemilik mengisi
   riwayat aslinya, karena entri contoh bukan riwayat orang ini. Pengisian tidak lagi menyentuh kode.
2. **Ukuran bundle.** Berkas JavaScript awal berukuran sekitar 2.30 MB (639 kB gzip), memicu
   peringatan Vite. Penyebab utamanya `three` dan `recharts` yang ikut pada bundle awal padahal
   hanya dipakai sebagian halaman. Perbaikan yang disarankan adalah pemecahan kode dengan
   `React.lazy` dan `manualChunks`. Belum dikerjakan karena belum menjadi prioritas.
3. **Surel notifikasi bergantung dua layanan luar.** Pesan selalu masuk ke tabel
   `portfolio_messages` lebih dulu, sedangkan surel notifikasi bersifat best effort: ia
   hanya terkirim bila `RESEND_API_KEY` dan `CONTACT_TO_EMAIL` terisi di sisi server.
   Selama domain pengirim belum diverifikasi di Resend, pengirim terbatas
   `onboarding@resend.dev` dan tujuan wajib surel pemilik akun. Bila surel gagal, pesan
   tetap tersimpan dan terbaca di tab Inbox, dan pengunjung tetap melihat status terkirim
   karena datanya memang tersimpan. Antarmuka tidak menjanjikan surel, hanya penerimaan
   pesan.
4. **Integrasi registry bergantung pihak ketiga.** Bila API berubah bentuk atau ditutup,
   halaman Keahlian akan menampilkan status offline. Tidak ada penjadwalan ulang otomatis
   selain tombol coba lagi.
5. **Belum ada pengujian otomatis.** Tidak ada uji unit maupun uji ujung ke ujung.
   Verifikasi masih manual melalui pemeriksaan tipe, build, dan pemeriksaan di browser.
6. **Recharts 2.15 sudah ditandai kedaluwarsa** oleh pengelolanya. Migrasi ke versi 3 akan
   mengubah sebagian API dan perlu dikerjakan sebagai tugas tersendiri.
7. **Render di sisi klien saja.** Mesin pencari modern umumnya masih dapat membaca situs ini,
   tetapi tidak ada prasajian atau pemuatan awal untuk konten di luar JavaScript.
8. **Panel admin menyunting teks dan entri, tetapi tidak semuanya.** Proyek, sertifikasi,
   keahlian, dan riwayat pekerjaan sudah dapat dikelola pemilik. Yang belum: `profile`
   (termasuk foto profil dan tautan sosial) serta `principles`, keduanya masih dari bundel dan
   dibaca lewat impor statis di `SiteHeader`, `SiteFooter`, `Home`, `About`, dan `Contact`.
   Registry teks juga baru memuat dua halaman, yaitu `global` dan `home`; tujuh halaman lain menyusul.
9. **Panel admin belum diuji dengan klik sungguhan di peramban.** Yang sudah diuji adalah lapisan
   data terhadap project nyata, termasuk keberhasilan dan penolakan jalur tulis, ditambah
   pemeriksaan tipe dan build. Alur masuk, ganti kata sandi, tombol di panel, dan unggahan berkas
   gambar sungguhan masih menunggu pemeriksaan manual pemilik.
10. **Kata sandi awal `defaultpassword` masih berlaku sampai pemilik menggantinya.** Kewajiban
    ganti kata sandi dipaksakan oleh basis data, tetapi selama belum diganti, kata sandi itu
    lemah. Ini alasan utama pemilik harus masuk sekali dan menggantinya.
11. **Perlindungan kata sandi bocor belum diaktifkan.** Supabase menyediakan pemeriksaan terhadap
    daftar kata sandi yang pernah bocor di Authentication > Sign In / Providers > Email. Fitur itu
    masih mati. Urutan aman: ganti dulu kata sandi akun admin menjadi frasa panjang yang tidak
    pernah bocor, baru aktifkan. Bila diaktifkan lebih dulu, akun yang masih memakai kata sandi
    lemah dapat langsung ditolak masuk sebelum pemilik sempat menggantinya.
12. **Tidak ada pembersihan berkas yang ditinggalkan.** Bila penghapusan baris scan berhasil tetapi
    penghapusan objek Storage-nya gagal, berkasnya tertinggal di bucket tanpa dirujuk siapa pun.
    Berkas seperti itu tidak pernah tampil di situs, dan kegagalannya hanya tercatat di konsol.
13. **Tabel penanda `portfolio_entity_usage` tidak pernah dibersihkan.** Ini disengaja, karena
    fungsinya mengingat bahwa pemilik sudah pernah mengisi sebuah daftar. Akibatnya pengujian tulis
    harus selalu dibungkus transaksi yang di-`rollback`, agar halaman publik tidak berhenti
    menampilkan entri contoh sebelum pemilik benar benar siap.
14. **Unggahan foto profil langsung masuk bucket, tetapi baru tampil di situs setelah diterbitkan.**
    Berkas diunggah ke `portfolio-media/profile/` dan path-nya ditulis ke kunci
    `global.profile.avatar`, yang tetap berupa draf sampai pemilik menekan `Publish page`. Panel
    Content kini menampilkan penanda pada kunci itu supaya langkah terakhir ini tidak terlewat.
    Kode unggah lama berbasis IndexedDB (`PhotoSlot.tsx`, `photoStore.ts`, `photoValidation.ts`)
    sudah dihapus karena tidak dipakai siapa pun.
15. **Sisa bahasa Indonesia di satu komponen UI.** Sudah diperbaiki pada revisi ini: label pembaca
    layar pada tombol tutup `src/components/ui/dialog.tsx` diganti dari `Tutup` menjadi `Close`.
16. **Berkas konfigurasi hosting sudah ada lengkap dengan header keamanan.** `vercel.json`
    menetapkan kerangka Vite, perintah build `npm run build`, keluaran `dist`, aturan pengalihan
    semua alamat ke `index.html`, dan kunci `headers` yang mengirim enam header keamanan pada
    setiap jawaban. Satu kelonggaran disengaja pada `img-src`, yaitu `https:` dibiarkan terbuka
    agar pemilik dapat menempelkan alamat gambar luar pada `global.profile.avatar` dan tetap
    tampil. `connect-src` dibatasi ke origin Supabase dan `verified-skill.com`. Langkah unggah ke
    Vercel dan variabel lingkungan yang wajib diisi dicatat pada riwayat perubahan di bagian 15.

## 13. Risiko dan Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Data contoh terbawa ke produksi | Kredibilitas hancur, isi tidak benar | Menandai data contoh di antarmuka dan di komentar berkas data. Wajib diganti sebelum publikasi |
| API registry ditutup atau berubah | Halaman Keahlian menampilkan status offline | Cacah 6 jam, penanganan gagal yang jujur, tombol coba lagi, dan penjelasan status |
| Menambah fitur tanpa memperbarui PRD | Dokumen dan kode saling bertentangan | Skill `prd-guardian` mewajibkan pencatatan |
| Tampilan menyimpang dari tema | Situs kembali terlihat generik | Skill `anti-slop-design` memuat daftar larangan dan daftar periksa |
| Ketergantungan pada pustaka animasi dan 3D yang besar | Bundle membengkak, waktu muat naik | Pemecahan kode menjadi utang teknis yang tercatat |
| Kelas CSS yang tidak ada dipakai | Tampilan rusak tanpa pesan error | Skill `project-map` memuat daftar lengkap kelas komponen yang tersedia |
| Kata sandi admin bocor | Situs dapat diubah orang lain | Kewajiban ganti kata sandi pada login pertama, panjang minimal 12 karakter, dan daftar izin hanya dapat diubah lewat SQL |
| Admin keliru menerbitkan teks | Situs publik langsung berubah | Setiap penerbitan menyimpan nilai sebelumnya, dan panel menyediakan tombol kembalikan |
| Supabase tidak dapat dijangkau | Panel tidak bisa dipakai, halaman publik tetap utuh | Situs membaca teks bawaan dari bundel bila basis data tidak menjawab, jadi pengunjung tidak melihat halaman kosong |
| Kunci istimewa ikut terbundel | Siapa pun dapat menulis ke basis data | Hanya kunci yang aman dipublikasikan yang dipakai di sisi klien. Penulisan tetap diperiksa di basis data lewat daftar izin |
| Skrip pihak ketiga disuntikkan ke halaman | Sesi admin atau isi teks dapat diambil alih | `script-src 'self'` tanpa `unsafe-inline` pada header `Content-Security-Policy`, dan tidak ada satu pun HTML mentah dari data yang dirender |
| Halaman ditanam di situs lain | Klik pengunjung dibajak tanpa disadari | `frame-ancestors 'none'` dan `X-Frame-Options: DENY` |
| Teks atau tautan entri disunting admin menyusupkan skema berbahaya | Pengunjung diarahkan ke alamat berbahaya | React meloloskan seluruh teks. `credentialUrl` saat ini hanya disimpan dan tidak pernah dirender sebagai tautan. Bila nanti dirender, skema `http` dan `https` wajib disaring lebih dulu |

## 14. Di Luar Ruang Lingkup

Daftar ini menjelaskan hal yang sengaja tidak dikerjakan, agar tidak menimbulkan harapan keliru.

1. Backend, basis data, dan API milik sendiri. Supabase dipakai sebagai layanan pihak ketiga, bukan dibangun sendiri.
2. Akun pengguna umum dan pendaftaran mandiri. Hanya akun admin yang dibuat manual lewat SQL.
3. Pengiriman formulir ke surel atau layanan pihak ketiga secara otomatis.
4. Blog atau artikel teknis.
5. Panel admin untuk mengelola profil, prinsip kerja, dan tata letak halaman. Panel yang ada menyunting teks registry serta empat daftar entri portofolio.
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

### 2026-09-15

- **POV Admin Ditambahkan**: panel admin di `/admin` dengan Supabase sebagai penyimpan teks dan Supabase Auth sebagai pintu masuk.
  - Keputusan pemilik produk: pemilik ingin dapat memperbarui teks situs tanpa menyentuh kode, dengan satu akun yang dibuatkan, yaitu nama pengguna `Arnalputra` dan kata sandi awal `defaultpassword` yang wajib diganti saat login pertama.
  - Keputusan teknis: Supabase Auth tidak mengenal nama pengguna, hanya surel. Karena itu nama pengguna dipetakan ke surel `arnal@steadbyte.com` di sisi klien, dan kata sandi tidak pernah disimpan di dalam kode.
  - Perubahan kode:
    - `src/lib/supabase.ts`, `.env`, `.env.example`: klien Supabase memakai URL project dan kunci yang aman dipublikasikan. Berkas `.env` masuk daftar abaikan Git.
    - `src/content/`: `types.ts`, `registry.ts`, `home.ts`, `global.ts`, dan `ContentProvider.tsx` sebagai registry teks beserta nilai bawaan dan lapisan pratinjau. Registry saat ini baru memuat halaman `global` dan `home`.
    - `src/admin/`: `AdminAuthProvider.tsx`, `PasswordForm.tsx`, `useAdminData.ts`, `ContentEditor.tsx`, dan `HistoryPanel.tsx`.
    - `src/lib/adminAccount.ts`: pemetaan nama pengguna ke surel, aturan panjang kata sandi, dan penerjemahan pesan galat autentikasi.
    - `src/pages/AdminLogin.tsx` dan `src/pages/AdminDashboard.tsx`, beserta `RequireAdmin` pada `src/App.tsx` dan `AdminAuthProvider` pada `src/main.tsx`.
    - `supabase/migrations/20260915000000_portfolio_admin.sql`: tabel `portfolio_admins`, `portfolio_content`, `portfolio_drafts`, `portfolio_revisions`, `portfolio_activity`, seluruhnya dengan row level security aktif, serta fungsi `security definer` untuk membaca keadaan admin, menandai kata sandi sudah diganti, menyimpan draf, membuang draf, menerbitkan, mengembalikan revisi, dan mencatat aktivitas.
  - **NFR-12 sampai NFR-15 dan FR-44 sampai FR-57 Dicatat**: kontrol akses, penulisan lewat fungsi, dan larangan membawa kunci istimewa ke sisi klien.
  - Verifikasi: `tsc -b` tanpa galat, `npm run build` berhasil, dan uji langsung ke project Supabase membuktikan permintaan tanpa sesi ditolak 401, sedangkan simpan draf, terbitkan, kembalikan revisi, serta buang seluruh draf berjalan benar.
  - Status: Selesai, kecuali butir 8 sampai 10 pada bagian 12 yang masih terbuka.

- **Cacat Revisi Pertama Ditemukan dan Diperbaiki**: penerbitan pertama sebuah kunci tidak menghasilkan baris revisi, sehingga kunci itu tidak dapat dikembalikan ke teks bawaan.
  - Penyebab: fungsi penerbitan menyalin nilai sebelumnya dengan `insert ... select ... from portfolio_content where key = r.key`. Bila kunci itu belum pernah diterbitkan, `select` mengembalikan nol baris, jadi tidak ada yang dicatat. Penolakan `safeupdate` atas `DELETE` tanpa klausa `WHERE` pada sesi sebelumnya adalah masalah berbeda pada baris `delete` yang sama.
  - Perbaikan: baris revisi kini selalu ditulis, dengan nilai kosong (`null`) bila belum ada nilai sebelumnya. Fungsi pengembalian revisi memang sudah memperlakukan nilai kosong sebagai perintah menghapus override dan kembali ke teks bawaan, jadi hanya sisi pencatatan yang perlu diperbaiki.
  - Perubahan kode: `supabase/migrations/20260915010000_portfolio_revision_capture.sql`, menggantikan `portfolio_publish` dan `portfolio_revert`.
  - Verifikasi: penerbitan kunci yang belum pernah diterbitkan kini menghasilkan satu baris revisi bernilai `null`, dan pengembalian baris itu menghapus override sehingga situs kembali ke teks bawaan.
  - Status: Selesai.

- **FR-50 Dilengkapi**: tombol `Discard all` ditambahkan pada panel editor.
  - Alasan: FR-50 menjanjikan draf dapat dibuang seluruhnya, dan `useAdminData.ts` sudah mendukungnya lewat `discardDrafts(null)`, tetapi tidak ada tombol yang memanggilnya. Janji itu belum dapat dipakai pemilik.
  - Perubahan kode: `src/admin/ContentEditor.tsx`, menambah `handleDiscardEveryPage` beserta tombolnya, aktif hanya bila ada draf.
  - Status: Selesai.

- **Berkas Dokumen Disinkronkan**: `docs/PRD.md` dan `.trae/skills/project-map/SKILL.md` disesuaikan dengan kode nyata, mencakup berkas di `src/admin/` dan `src/content/`, rute `/admin`, tabel beserta fungsi basis data, serta jebakan yang sudah pernah terjadi. `PROJECT.md` dibiarkan tanpa perubahan karena sudah menyebut Supabase Auth dan Supabase Storage pada tumpukan teknologinya.

- **Verifikasi Dijalankan pada Revisi Ini**: `npx tsc --noEmit -p tsconfig.json` keluar 0 error, `npm run build` berhasil (2.26 MB mentah, 628 kB gzip), dan dev server menjawab HTTP 200 untuk `/`, `/admin/login`, serta `/admin`.
  - Yang belum diverifikasi: klik sungguhan pada panel admin di peramban. Butir 9 pada bagian 12 masih terbuka.
  - Status: Selesai.

- **Pengelolaan Entri Portofolio (Job Experience, Projects, Certifications, Skills)**: pemilik dapat menambah, mengubah, menyembunyikan, mengurutkan, dan menghapus entri keempat daftar tersebut langsung dari tab **Entries** di panel admin, tanpa menyentuh kode.
  - Alasan: permintaan pemilik produk, "ingin juga untuk nanti bisa menambahkan job experience (bisa add banyak), menambahkan certificate (berupa gambar & slideshow), bisa menambah skill dan lain-lain yang dapat membantu untuk portofolio kerjaan".
  - Keputusan yang disetujui pemilik produk: keempat entitas dikelola; model simpan **tulis langsung** dengan **sakelar tampil** (bukan alur draf lalu publikasi); data awal **mulai kosong**.
  - Perubahan kode: tabel `portfolio_career`, `portfolio_projects`, `portfolio_certifications`, `portfolio_skills`, dan `portfolio_certification_images` beserta fungsi `portfolio_entries()`, `portfolio_save_career/project/certification/skill()`, `portfolio_set_entry_visible()`, `portfolio_delete_entry()`, `portfolio_reorder_entries()`, dan `portfolio_add/delete/reorder_certification_images()`. Di sisi klien: `src/entries/EntriesProvider.tsx` (baca + fallback per daftar), `src/entries/useEntryWriter.ts` (semua penulisan), `src/entries/types.ts` (tipe + parser batas), dan `src/admin/EntriesPanel.tsx` (empat formulir, daftar, pengurutan, sakelar tampil, unggah scan).
  - **Fallback per daftar**: selama sebuah daftar belum pernah ditulis, halaman publik menampilkan entri contoh yang ikut ter-bundel supaya halaman tidak terlihat rusak. Begitu pemilik menyimpan entri pertama, daftar itu beralih sepenuhnya ke isi tabel. Tabel penanda `portfolio_entity_usage` yang diisi trigger `after insert` pada keempat tabel entitas membedakan "belum pernah diisi" dari "sengaja dikosongkan"; tanpa penanda itu, pemilik yang menghapus semua entri contoh akan melihatnya muncul kembali, yang tidak jujur.
  - Status: Selesai. `npx tsc -b` dan `npm run build` keluar 0.

- **Scan Sertifikat dan Slideshow Layar Penuh**: setiap sertifikat dapat memiliki beberapa gambar scan. Pemilik mengunggahnya dari formulir sertifikat, dan halaman **Credentials** menampilkannya dalam slideshow layar penuh untuk pengunjung.
  - Alasan: permintaan pemilik produk, sertifikat "berupa gambar & slideshow".
  - Perubahan kode: bucket Storage `portfolio-media` (publik, batas 5 MB per berkas, hanya JPEG/PNG/WebP), tabel `portfolio_certification_images`, fungsi `portfolio_add/delete/reorder_certification_images()`, `src/entries/EntriesProvider.tsx` (`scansFor()` mengembalikan `url` sekaligus `storagePath`), blok unggah `CertificateScans` di `src/admin/EntriesPanel.tsx`, dan komponen baru `src/components/CertificateSlideshow.tsx` yang dipasang di `src/pages/Credentials.tsx`.
  - Keputusan yang disetujui pemilik produk: **beberapa gambar per sertifikat**, dengan slideshow layar penuh.
  - Aturan yang dipegang: berkas diunggah lebih dulu, barisnya menyusul; bila baris ditolak, objek yang sudah terunggah dihapus kembali supaya tidak ada berkas yatim. Saat menghapus, baris dihapus lebih dulu, objeknya menyusul. Blok unggah hanya muncul pada sertifikat yang sudah tersimpan, karena scan selalu menempel pada baris yang ada. Slideshow tidak dirender sama sekali selama belum ada scan, sehingga halaman Credentials tidak berubah bagi pemilik yang belum mengunggah apa pun. Ikut tersembunyi bila sertifikat induknya disembunyikan, sesuai policy RLS tabel gambar.
  - Status: Selesai. `npx tsc -b` dan `npm run build` keluar 0. Belum diuji dengan berkas gambar sungguhan; butir 9 pada bagian 12 masih terbuka.

- **Alur Pemulihan Password Admin (Forgot & Reset Password)**: admin dapat meminta link pemulihan kata sandi via email (`/admin/forgot-password`) dan menyetel kata sandi baru dari tautan tersebut (`/admin/reset-password`).
  - Alasan: permintaan pemilik produk untuk menambahkan fitur forgot password dan reset password berbasis email terdaftar Supabase.
  - Perubahan kode:
    - `src/lib/adminAccount.ts`: penambahan helper `resolveAdminEmail` untuk memetakan input username/email ke email terdaftar.
    - `src/admin/AdminAuthProvider.tsx`: penambahan metode `sendPasswordReset` (memanggil `supabase.auth.resetPasswordForEmail`) dan `resetPasswordWithToken` (memanggil `supabase.auth.updateUser`).
    - `src/pages/AdminForgotPassword.tsx` & `src/pages/AdminResetPassword.tsx`: pembuatan antarmuka halaman baru sesuai skema Rust & Ink.
    - `src/pages/AdminLogin.tsx`: menyambungkan tautan "Forgot password?".
    - `src/App.tsx`: mendaftarkan rute `/admin/forgot-password` dan `/admin/reset-password`.
  - Verifikasi: `npx tsc --noEmit` keluar 0 error, `npm run build` sukses.
  - Status: Selesai.

- **Foto Profil dan Penyuntingan Teks Seluruh Halaman**: foto profil tampil di samping teks hero Beranda dan dapat diganti dari tab Content, dan seluruh halaman kini membaca kata-katanya dari registry konten, bukan dari teks yang dipatri di komponen.
  - Alasan: permintaan pemilik produk, "Saya juga ada foto profile saya nantinya (yang menyesuaikan dengan tema yang ada pada webapp sekarang) di home. Dan fotonya bisa diganti dan disesuaikan dari Admin Pages. Saya ingin setiap pagesnya itu juga bisa di edit dari kata-katanya juga pada admin."
  - Keputusan yang disetujui pemilik produk: posisi foto **di samping teks hero**, dan penyuntingan teks dibuka untuk **semua halaman sekaligus**.
  - Perubahan kode:
    - `src/content/global.ts`, kunci baru `global.profile.avatar` berisi path berkas di Storage, bukan URL penuh.
    - `src/admin/ContentEditor.tsx`, blok khusus untuk kunci itu: pratinjau gambar, tombol unggah berkas ke `portfolio-media/profile/`, dan kolom teks untuk menempel URL atau path.
    - `src/pages/Home.tsx`, bingkai foto bergaya karat (`rounded-notch`, garis `primary`, saringan `grayscale contrast-125 sepia`) di samping paragraf lead. Bingkai disembunyikan sendiri bila berkasnya gagal dimuat, sehingga halaman tidak menampilkan gambar rusak.
    - Registry dipecah menjadi satu berkas per halaman: `career.ts`, `projects.ts`, `credentials.ts`, `skills.ts`, `about.ts`, `contact.ts`, dan `notfound.ts`, lalu dirakit di `src/content/registry.ts` beserta `PAGE_META`.
    - `src/pages/`: `Career.tsx`, `Projects.tsx`, `Credentials.tsx`, `Skills.tsx`, `About.tsx`, `Contact.tsx`, dan `NotFound.tsx` kini memanggil `useSiteText()` untuk judul, lead, label statistik, judul seksi, dan tombolnya.
  - Aturan yang dipegang: teks yang memuat angka hasil hitungan tetap menyisakan token, misalnya `{count} skills, filtered by the kind of work`, supaya jumlahnya tidak ikut dibekukan saat pemilik menyunting kalimatnya.
  - Verifikasi: `npx tsc -b` keluar 0 dan `npm run build` berhasil (2,32 MB mentah, 643 kB gzip). Belum diuji dengan berkas foto sungguhan; butir 9 pada bagian 12 masih terbuka.
  - Status: Selesai.

- **Verifikasi Basis Data Langsung**: migrasi `portfolio_entry_usage` diterapkan ke proyek Supabase dan hasilnya diperiksa langsung lewat SQL, bukan hanya lewat pembacaan berkas migrasi.
  - Yang terverifikasi: tabel `portfolio_entity_usage` ada dengan RLS aktif dan policy baca publik; keempat trigger `after insert ... for each statement` terpasang (`tgtype = 4`); seluruh fungsi tulis entitas `security definer` dengan hak eksekusi hanya untuk `authenticated`; keempat RPC daftar nilai terbuka untuk `anon`; bucket `portfolio-media` publik dengan batas 5.184.288 byte dan allowlist MIME yang benar; keempat policy `storage.objects` ada sehingga unggah dan hapus hanya untuk admin terautentikasi; seluruh tabel entitas ber-RLS dengan policy baca saja (tulis tertutup secara default).
  - Uji jalur tulis: dipanggil `portfolio_save_skill()` sebagai peran `authenticated` dengan klaim email admin di dalam transaksi yang di-`rollback`. Hasilnya admin check lolos, baris tersimpan, dan tabel penanda terisi otomatis, membuktikan trigger bekerja. Transaksi dibatalkan sehingga basis data tetap kosong dan halaman publik tetap menampilkan entri contoh. Pemanggilan yang sama dengan email bukan admin ditolak dengan `42501`, sesuai rancangan deny-by-default.
  - Catatan untuk pekerjaan berikutnya: tabel penanda tidak pernah dibersihkan, jadi uji tulis tidak boleh dilakukan di luar transaksi sampai pemilik benar-benar mengisi datanya.
  - Status: Selesai.

- **Nama Pemilik Dikoreksi**: seluruh penyebutan "Arnal Firmansyah" diubah menjadi "Arnal Putra".
  - Alasan: permintaan pemilik produk. Nama yang benar adalah Arnal Putra.
  - Perubahan kode: tidak ada perubahan pada kode, karena `src/data/portfolio.ts` sudah memakai `fullName: "Arnal Putra"` sejak awal. Yang salah hanya judul dan baris pemilik produk di dokumen ini.
  - Status: Selesai.

- **Kluster 3D Node Terhubung ke Data Skill Admin**: kluster topologi 3D pada halaman utama (`HeroScene`) kini terhubung langsung ke daftar skill yang dikelola admin via `useEntries()`, serta interaktif saat node diklik.
  - Alasan: permintaan pemilik produk, "ingin cluster ini jika diklik nodenya, itu muncul Skill yang memang dibuat dari POV admin. Saya ingin dijadikan untuk skill skill saya nantinya. Skill saya yang memang saya input dari POV Admin."
  - Keputusan yang disetujui pemilik produk: interaktivitas berupa kartu mengambang/tooltip interaktif yang menampilkan nama skill, kategori, tingkat penguasaan (proficiency), tahun pengalaman, tahun aktif terakhir, serta tautan ke halaman `/skills`.
  - Perubahan kode: `src/components/three/HeroScene.tsx`. Kluster membangun posisi node dan pewarnaan berdasarkan daftar skill nyata (`useEntries()`), node membedakan aksi klik dan seret/drag, dan saat sebuah node diklik muncul kartu detail interaktif di pojok kluster.
  - Status: Selesai. `npx tsc -b` dan `npm run build` keluar 0.

- **Interaksi Kartu Node 3D Dirapikan**: penutupan kartu detail node kini beranimasi, dan kartu lama otomatis menutup saat node lain dibuka.
  - Alasan: permintaan pemilik produk. Animasi masuk sudah terasa benar, tetapi penutupan masih memotong kartu secara mendadak, kartu lama tetap terbuka saat berpindah node, dan tidak ada cara menutup lewat klik di luar kluster.
  - Perubahan kode: `src/components/three/HeroScene.tsx`.
    - Animasi keluar memakai `animate-out fade-out-0 zoom-out-95` dengan durasi 180 ms, lalu kartu dilepas setelah 200 ms agar animasi keluar selalu terlihat tuntas. Durasi masuk dan keluar disamakan supaya terasa konsisten.
    - Berpindah node menjalankan animasi keluar pada kartu lama lebih dulu, lalu membuka kartu node baru setelah animasi selesai. Klik pada node yang sedang aktif tidak menutup kartu, dan animasi keluar yang sedang berjalan hanya diperbarui target kartu berikutnya, tidak dimulai ulang.
    - Klik kiri di luar area kluster menutup kartu. Klik pada node tidak dibaca sebagai klik luar lewat penanda `nodeHit`; klik kanvas kosong dan klik di dalam kartu tidak menutup kartu, sedangkan tombol tutup tetap bekerja.
    - Rotasi otomatis kluster dibekukan selama kursor berhenti di atas sebuah node. Tanpa ini, node bergeser di antara penekanan dan pelepasan tombol, sehingga klik bisa mendarat di objek yang berbeda dan kartu tidak pernah terbuka.
  - Temuan teknis penting: kelas `duration-*` Tailwind hanya mengatur `transition-duration`, sedangkan `.animate-out` bawaan `tailwindcss-animate` memakai 150 ms. Karena itu durasi animasi kartu diatur lewat `animationDuration` inline, bukan lewat kelas `duration-*`.
  - Verifikasi: harness 30 node contoh di halaman uji sementara melaporkan 30/30 node membuka kartu dengan nama yang sesuai dan 15/15 pemeriksaan interaksi lolos. Halaman Beranda dengan data Supabase nyata melaporkan 12/12 pemeriksaan lolos. Pemeriksaan mencakup durasi animasi masuk dan keluar, tutup-otomatis saat pindah node, klik di dalam kartu, klik di luar kluster, tombol tutup, seret tanpa membuka kartu, dan klik kanvas kosong. `npx tsc -b` dan `npm run build` keluar 0. Berkas uji sementara sudah dihapus.
  - Status: Selesai.

- **Ukuran Node 3D Diperbesar**: node kluster pada halaman utama dibuat lebih besar agar mudah diklik.
  - Alasan: permintaan pemilik produk, node terasa terlalu kecil untuk dijangkau kursor.
  - Perubahan kode: `src/components/three/HeroScene.tsx`. Skala dasar node naik dari `0.05 + level/100 × 0.032` menjadi `0.082 + level/100 × 0.05`, sehingga diameter node di layar menjadi sekitar dua kali lipat dan tetap membesar seiring tingkat penguasaan. Skala saat node ter-hover atau terpilih diturunkan dari `2.2×` menjadi `1.8×` agar node tidak membengkak saat disorot.
  - Temuan sekaligus perbaikan: spin tambahan kluster saat kartu terbuka masih memakai syarat `hovered !== null || selectedSkill !== null`, sehingga kluster ikut berputar ketika kursor berhenti di atas sebuah node dan node bergeser dari bawah kursor sebelum klik mendarat. Syaratnya diperbaiki menjadi `selectedSkill !== null && hovered === null` agar pembekuan rotasi saat hover benar-benar berlaku.
  - Verifikasi: diuji di browser headless lewat CDP pada Beranda dengan data Supabase nyata. Node ter-hover dapat diklik dan membuka kartu "LEADERSHIP | Digital Process Lead | PROFICIENCY 80% | EXPERIENCE 2 yrs | Active 2026". Klik kiri di luar area kluster menutup kartu, dan kelas `animate-out` terlihat aktif pada 80 ms setelah klik sehingga animasi keluar benar-benar berjalan sebelum kartu dilepas. Tangkapan layar sebelum dan sesudah dibandingkan untuk memastikan pembesaran node terlihat. `npx tsc --noEmit` dan `npm run build` keluar 0, HMR dev server tanpa error. Berkas uji sementara sudah dihapus.
  - Status: Selesai.

- **Kesiapan Deploy Ditambahkan**: berkas `vercel.json` dibuat agar aplikasi dapat dijalankan sebagai situs statis dengan perutean sisi klien.
  - Alasan: permintaan pemilik produk, "nantinya saya ingin koneksikan juga ke Vercel". Tanpa aturan pengalihan, membuka `/projects` langsung atau menyegarkan halaman di sana akan menghasilkan 404 karena hosting mencari berkas fisik yang tidak ada, sementara rute sebenarnya ditangani `BrowserRouter` di `src/main.tsx`.
  - Perubahan kode: `vercel.json` baru, berisi `framework: "vite"`, `buildCommand: "npm run build"`, `outputDirectory: "dist"`, dan `rewrites` dari `/(.*)` ke `/index.html`. Aturan pengalihan hanya berlaku bila tidak ada berkas statis yang cocok, sehingga aset di `dist/assets/` tetap tersaji normal.
  - Verifikasi: `npx tsc -b` keluar 0. Perilaku pengalihan belum diuji karena belum ada deployment.
  - Status: Selesai.

- **Sisa Bahasa Indonesia pada Komponen UI Dihapus**: label pembaca layar pada tombol tutup dialog diganti.
  - Alasan: situs berbahasa Inggris, sedangkan `src/components/ui/dialog.tsx` masih memuat `<span className="sr-only">Tutup</span>`. Teks itu tidak terlihat mata tetapi terbaca pembaca layar.
  - Perubahan kode: `src/components/ui/dialog.tsx`, dari `Tutup` menjadi `Close`.
  - Verifikasi: penyisiran Bahasa Indonesia di `src/` kini bersih; `npx tsc -b` keluar 0.
  - Status: Selesai.

- **Sakelar Tema Jadi Ikon Saja**: label teks LIGHT dan DARK pada `ThemeToggle` dihapus, menyisakan ikon matahari dan bulan.
  - Alasan: permintaan pemilik produk. Teks itu membuat sakelar lebih lebar dari yang perlu dan ikon sudah cukup menjelaskan fungsinya.
  - Perubahan kode: `src/components/fx/ThemeToggle.tsx`. Lebar tombol turun dari 62 px menjadi 56 px. Sebelumnya hanya satu ikon tampil karena ikon berada di dalam knob yang bergeser; kini knob dipisah dari ikon. Knob 24 px menjadi lapisan di belakang, dan dua ikon diletakkan pada grid dua sel 24 px di atasnya dengan `z-10`. Ikon yang aktif berwarna `text-background` sehingga terlihat sebagai bentuk terpotong dari knob, ikon yang tidak aktif berwarna `text-muted-foreground`.
  - Susunan ikon mengikuti konvensi sakelar tema: matahari di kiri, bulan di kanan, dan knob berada di sisi ikon yang aktif. Konsekuensinya posisi knob di mode gelap kini di kanan, sedangkan sebelumnya di kiri.
  - Aksesibilitas dipertahankan: `role="switch"`, `aria-checked`, dan `aria-label="Switch between light and dark theme"` tetap ada, jadi pembaca layar masih menerima status tema walau tidak ada teks terlihat. Cincin fokus tetap dari aturan global `:focus-visible` di `src/index.css`.
  - Verifikasi: diuji di browser headless lewat CDP pada Beranda. 8 dari 8 pemeriksaan lolos: label teks benar-benar kosong, knob di kanan saat gelap dan di kiri saat terang, transisi knob 0,3 detik, dua ikon hadir, ikon aktif terpusat di bawah knob, `aria-checked` mengikuti mode, tinggi sakelar tetap 32 px. Tangkapan layar sakelar dan header pada mode gelap dan terang diperiksa langsung. `npx tsc --noEmit` keluar 0. Berkas uji sementara sudah dihapus.
  - Status: Selesai.

- **Kursor Kustom Bernuansa Teknis Ditambahkan**: kursor bawaan diganti reticle yang menyesuaikan tema, di halaman utama maupun panel admin.
  - Alasan: permintaan pemilik produk, "Saya ingin pointernya juga berubah menyesuaikan tema pada webappnya. Mungkin yang berupa pointer yang berdigitalisasi dan berteknologi". Lewat pertanyaan pilihan, pemilik produk memilih gaya reticle atau crosshair teknis dan memilih kursor bawaan diganti penuh, bukan sekadar ditambah hiasan.
  - Perubahan kode:
    - `src/components/fx/CursorAura.tsx`: ditulis ulang. Isinya kini tiga lapisan yang bergerak bersama. Lapisan pertama adalah aura lama yang tetap ada. Lapisan kedua adalah braket empat sudut berukuran 26 px yang mengikuti pointer dengan pegas lebih lambat, sehingga terlihat tertinggal di belakang. Lapisan ketiga adalah crosshair yang menempel tepat pada pointer tanpa jeda. Braket mengecil menjadi 18 px saat terkunci pada sasaran dan 14 px saat tombol ditekan, sementara titik tengah crosshair membesar dari 3 px menjadi 5 px.
    - `src/components/fx/CursorAura.tsx`: label mono kecil muncul di samping braket saat kursor berada di atas elemen interaktif. Nama label ditentukan `targetTag()`, dan atribut `data-cursor` pada elemen menang atas dugaan dari nama tag. Karena itu `HeroScene` dapat menamai keadaannya sendiri, sedangkan elemen lain memakai nama bawaan seperti `LINK`, `BUTTON`, `FIELD`, `TOGGLE`, `TAB`, dan `MENU`.
    - `src/components/three/HeroScene.tsx`: atribut `data-cursor` ditambahkan pada wadah kluster, bernilai `GRAB`, `NODE`, atau `DRAG` mengikuti keadaan seret dan hover. Tanpa ini, kemampuan yang dulu dibawa kursor bawaan hilang begitu kursor bawaan disembunyikan.
    - `src/index.css`: kursor bawaan disembunyikan lewat kelas `cursor-reticle` pada elemen `html`, hanya di layar selebar 1024 px ke atas, karena di bawah itu reticle memang tidak digambar. Kolom teks, area teks, dan `[contenteditable="true"]` dikecualikan dan tetap memakai `cursor: text` agar menyunting tetap nyaman.
  - Keputusan teknis: seluruh posisi digerakkan `useMotionValue` dan `useSpring` dari Framer Motion, bukan state React, karena `pointermove` terlalu sering dipanggil untuk memicu render. Status terkunci dan status tertekan disimpan di ref lalu disalin ke state hanya saat nilainya benar-benar berubah. Kursor hanya aktif bila perangkat menunjuk dengan presisi (`pointer: fine`), sehingga perangkat sentuh tidak terpengaruh.
  - Temuan teknis penting: aturan `cursor: none` wajib memakai `!important`. CSS Tailwind di `@layer base` dipancarkan sebelum `@layer utilities`, dan urutan layer mengalahkan spesifisitas, sehingga tanpa `!important` kursor bawaan masih menang di elemen yang memakai kelas seperti `cursor-grab`.
  - Aksesibilitas: `prefers-reduced-motion` mematikan reticle sepenuhnya, kursor bawaan kembali dipakai, dan kelas `cursor-reticle` tidak dipasang. Seluruh lapisan reticle bertanda `aria-hidden` dan `pointer-events-none` sehingga tidak menghalangi klik maupun dibacakan pembaca layar.
  - Verifikasi: diuji di browser headless lewat CDP pada Beranda. 17 dari 17 pemeriksaan lolos, meliputi reticle tergambar dan berpusat pada pointer, kursor bawaan tersembunyi (`cursor: none`), kelas terpasang di `html`, braket diam 26 px, label kosong saat menganggur, label `LINK` di atas tautan navigasi, label `GRAB` di atas kanvas 3D sesuai `data-cursor`, caret tetap `text` di kolom teks, braket mengecil 14 px dan titik membesar 5 px saat ditekan, warna reticle dan label berubah mengikuti tema (`rgb(215, 89, 51)` ke `rgb(196, 75, 39)`), serta reduced-motion mematikan reticle dan mengembalikan kursor bawaan. Tangkapan layar mode gelap dan terang diperiksa langsung. `npx tsc --noEmit` keluar 0. Berkas uji sementara sudah dihapus.
  - Status: Selesai.

- **Pemeriksaan Penasihat Keamanan Supabase Dijalankan**: `get_advisors` tipe `security` dijalankan terhadap proyek nyata.
  - Temuan yang menunggu tindakan: Leaked Password Protection masih mati (butir 11 pada bagian 12).
  - Temuan yang sengaja dibiarkan: `portfolio_admins` ber-RLS tanpa policy, karena tabel itu hanya boleh dibaca lewat fungsi `security definer` dan memang tidak boleh diakses langsung oleh `anon` maupun `authenticated`.
  - Temuan yang salah sasaran untuk proyek ini: peringatan bahwa `anon` dapat memanggil `portfolio_entries()` dan `portfolio_is_admin()`. Keduanya `security definer` dengan maksud itu: yang pertama hanya mengembalikan baris yang bertanda `visible`, dan yang kedua hanya mengembalikan benar atau salah tanpa pernah menulis. Peringatan `rls_auto_enable()` berasal dari bawaan proyek, bukan kode kita.
  - Status: Selesai, kecuali butir 11 yang menunggu tindakan pemilik.

### 2026-09-16

- **Foto Profil Tidak Muncul di Beranda Diperbaiki**: foto yang diunggah pemilik ternyata tidak pernah tampil di halaman publik.
  - Alasan: laporan pemilik produk, "Saya sudah coba upload fotonya, ini tidak muncul di home ya untuk fotonya."
  - Penyebab: unggahan berkas memang berhasil dan objeknya sudah ada di bucket `portfolio-media/profile/`, tetapi `setField` hanya menulis ke keadaan editor, sehingga kunci `global.profile.avatar` masih berupa draf di `portfolio_drafts`. Halaman publik membaca `portfolio_content` saja, jadi fotonya belum pernah masuk ke nilai yang dibaca pengunjung.
  - Bukti: kueri `select key, value from public.portfolio_content` sebagai peran `anon` mengembalikan nol baris untuk kunci itu, sedangkan `portfolio_drafts` memuatnya. Setelah fungsi aplikasi sendiri dijalankan sebagai admin, barisnya muncul di `portfolio_content`.
  - Perbaikan data: nilai itu diterbitkan lewat fungsi yang memang dipakai aplikasi, yaitu `portfolio_publish(array['global.profile.avatar'])`, dijalankan sebagai peran `authenticated` dengan klaim surel admin. Hasilnya satu baris `portfolio_content`, satu baris `portfolio_revisions` bernilai lama kosong, dan satu baris aktivitas "1 key(s) published". Draf `global.profile.email` sengaja tidak ikut diterbitkan.
  - Perbaikan kode: `src/admin/ContentEditor.tsx` kini menampilkan penanda `role="status"` pada blok `global.profile.avatar` yang menyatakan bahwa berkas sudah ada di bucket tetapi belum terlihat pengunjung sampai `Save drafts` lalu `Publish page` ditekan.
  - Verifikasi: diuji di browser headless lewat CDP pada Beranda dengan data Supabase nyata, 6 dari 6 pemeriksaan lolos; gambar hero termuat penuh (`naturalWidth 3936 × 2624`, `complete: true`). Tangkapan layar diperiksa langsung. Berkas uji sementara sudah dihapus.
  - Status: Selesai.

- **Satu Jalur Unggah Saja Ditinggalkan**: kode unggah foto berbasis IndexedDB dihapus karena tidak dipakai siapa pun.
  - Alasan: setelah foto profil tampil dari `portfolio-media`, tersisa dua jalur unggah di repo, dan jalur lama itu menyesatkan. Berkasnya tersimpan di peramban saja, tidak pernah terlihat pengunjung, dan tidak diimpor satu berkas pun.
  - Perubahan kode: `src/components/home/PhotoSlot.tsx`, `src/lib/photoStore.ts`, dan `src/lib/photoValidation.ts` dihapus. Penyisiran `src/` memastikan tidak ada impor yang tertinggal. Satu-satunya jalur unggah foto sekarang ada di `src/admin/ContentEditor.tsx`.
  - Perubahan dokumen: butir 14 pada bagian 12 diganti agar tidak lagi menyebut IndexedDB, dan `text(key)` pada `.trae/skills/project-map/SKILL.md` diperbaiki menjadi `previewing ? drafts[key] ?? overrides[key] : overrides[key]` supaya perilaku draf yang menjadi sebab masalah ini tercatat dengan benar.
  - Status: Selesai.

- **Ukuran Foto Hero Diperbesar**: bingkai foto di samping paragraf lead Beranda dinaikkan dari 80/96 px menjadi ukuran sedang-besar.
  - Alasan: permintaan pemilik produk, "Saya ingin fotonya jauh lebih besar, itu terlalu kecil. Ukuran sedang-besar."
  - Perubahan kode: `src/pages/Home.tsx`, bingkai foto dari `size-20 sm:size-24` menjadi `size-36 sm:size-44 xl:size-52`. Nilai `xl` dipakai, bukan `lg`, karena pada 1024 px kolom teks sudah menyempit ke 356 px sehingga bingkai 208 px akan memakan ruang yang tidak sepadan.
  - Hasil terukur lebar bingkai: 144 px di 390 px, 176 px di 768 px sampai 1024 px, 208 px di 1280 px ke atas. Kolom paragraf tetap 473 px di 1280 px dan tidak ada gulir mendatar baru pada semua lebar uji.
  - Verifikasi: diuji di browser headless lewat CDP pada enam lebar layar (1920, 1440, 1280, 1024, 768, 390). Foto termuat penuh di semua lebar, bingkai dan paragraf tetap berdampingan di atas 640 px, dan tidak muncul luapan mendatar baru. Tangkapan layar 1440 px dan 390 px diperiksa langsung. `npx tsc --noEmit` keluar 0 dan `npm run build` berhasil. Berkas uji sementara sudah dihapus.
  - Status: Digantikan oleh butir di bawah setelah pemilik menilai hasilnya masih terlalu kecil.

- **Ukuran Foto Hero Digandakan Lagi**: bingkai foto hero dinaikkan dua kali lipat dari 208 px menjadi 416 px di desktop.
  - Alasan: permintaan pemilik produk, "Masih kekecilan, bisakah ukurannya x2 dari yang existing sekarang?"
  - Perubahan kode: `src/pages/Home.tsx`, kelas bingkai dari `size-36 sm:size-44 xl:size-52` menjadi `size-72 sm:size-[352px] xl:size-[416px]`, dan titik henti baris samping dipindah dari `sm:flex-row` ke `xl:flex-row`. Pemindahan itu wajib: pada 768 px sampai 1024 px kolom kiri hanya 556 px sampai 720 px, sehingga bingkai 352 px akan menyisakan 180 px sampai 344 px untuk paragraf. Di bawah 1280 px foto kini bertumpuk di atas paragraf, pola yang sama dengan tata letak ponsel.
  - Hasil terukur lebar bingkai: 288 px di 390 px, 352 px di 640 px sampai 1024 px, 416 px di 1280 px ke atas. Pada 1280 px ke atas bingkai dan paragraf tetap berdampingan, dengan paragraf 265 px sampai 289 px lebar dan 6 sampai 7 baris. Uji simulasi ukuran bingkai membuktikan bingkai 480 px akan menyempitkan paragraf menjadi 201 px di 1280 px, jadi 416 px dipilih sebagai batas atas.
  - Verifikasi: diuji di browser headless lewat CDP pada tujuh lebar layar (1920, 1440, 1280, 1024, 768, 640, 390). Foto termuat penuh di semua lebar, tanpa galat konsol, dan bingkai tidak pernah melebihi lebar kolomnya. Tangkapan layar 1440 px, 1024 px, dan 390 px diperiksa langsung. `npx tsc --noEmit` keluar 0 dan `npm run build` berhasil. Berkas uji sementara sudah dihapus.
  - Catatan terpisah di luar lingkup perubahan ini: pada lebar 1024 px tepat, halaman sudah memiliki gulir mendatar sekitar 37 px dari deretan menu header dan penanda berjalan di footer. Luapan itu terbukti tidak berasal dari bingkai foto, karena mengecilkan bingkai kembali ke 96 px tidak mengubah lebar gulir dokumen sama sekali. Belum diperbaiki.
  - Status: Selesai.

- **Isi Strip Berjalan Dapat Disunting dari Panel**: item pada strip berjalan Beranda dan footer tidak lagi dipatri di dalam komponen, melainkan dibaca dari registry konten.
  - Alasan: permintaan pemilik produk, "Pastikan ini juga bisa edit di admin ya", disertai tangkapan layar strip keahlian di Beranda.
  - Keadaan sebelumnya: strip Beranda sebenarnya sudah turunan dari `stack` tiap peran pada riwayat pekerjaan, jadi isinya ikut berubah bila pemilik menyunting salah satu peran. Namun isi itu tidak punya kolom sendiri, dan strip footer masih berupa larik sepuluh nama yang dipatri di `SiteFooter.tsx`.
  - Perubahan kode: kunci `home.stack.marquee` ditambahkan pada `src/content/home.ts` dan `footer.rollingStrip` pada `src/content/global.ts`, keduanya dengan penanda `multiline` supaya tampil sebagai kotak teks satu item per baris. `src/pages/Home.tsx` dan `src/components/layout/SiteFooter.tsx` membaca kunci itu, memecahnya per baris, dan menyaring baris kosong.
  - Perilaku yang dipilih pemilik: strip Beranda memakai daftar tersunting bila diisi, dan kembali mengikuti riwayat pekerjaan bila dibiarkan kosong, sehingga tampilan hari ini tetap sama tanpa memaksa pemilik menyimpan seluruh riwayat lebih dulu. Nilai bawaannya sengaja dikosongkan agar tidak ada teknologi contoh yang tertinggal setelah riwayat asli masuk. Strip footer tidak punya sumber turunan, jadi nilai bawaannya adalah sepuluh item yang selama ini tampil, dan menghapus semua baris menyembunyikan strip itu.
  - Verifikasi: diuji di browser headless lewat CDP pada Beranda. Strip Beranda tetap berisi 20 item yang sama dan strip footer tetap 10 item yang sama seperti sebelum perubahan, tanpa galat konsol. Registry di peramban diperiksa langsung: `home.stack.marquee` dan `footer.rollingStrip` terdaftar dengan `multiline: true`, dan nilai bawaan footer berisi 10 baris. `npx tsc --noEmit` keluar 0 dan `npm run build` berhasil. Berkas uji sementara sudah dihapus.
  - Status: Selesai.

- **Peningkatan Template Surel Rust & Ink dan POV Admin Inbox**: memperbarui template HTML surel notifikasi yang dikirim ke pemilik dan meningkatkan antarmuka inbox admin.
  - Kebutuhan: permintaan pemilik produk untuk memperjelas template surel yang masuk ke inbox pemilik (dengan tema Rust & Ink yang rapi, tanpa auto-reply ke pengunjung untuk mencegah spam), serta memberikan tampilan POV Admin di webapp agar admin dapat meninjau detail pengirim (nama, email, timestamp, topic, isi pesan), memfilter/mencari pesan, menyalin email, dan membalas langsung.
  - Perubahan kode:
    - `api/contact.ts`: memperbarui `renderEmail()` dan konstanta warna Rust & Ink (`INK_850`, `INK_400`, `MOSS`). Template surel kini dilengkapi header badge `07 / INCOMING INQUIRY`, box detail pengirim (name, email, timestamp), message content box bergaris putus-putus, dan action callout box.
    - `src/admin/MessagesPanel.tsx`: menambahkan filter status (`all`, `unread`, `read`), input pencarian (search text sender, topic, message), tombol copy email ke clipboard pada dialog detail, serta meningkatkan layout POV Admin saat membuka dialog pesan.
  - Verifikasi: `npx esbuild api/contact.ts --outfile=nul` berhasil (8,9 kB output, exit 0), `npx tsc --noEmit` keluar 0, dan `npm run build` berhasil tanpa error.
  - Status: Selesai.

- **Header Keamanan HTTP Ditambahkan Sebelum Naik ke Vercel**: situs sebelumnya tidak mengirim satu pun header keamanan.
  - Alasan: permintaan pemilik produk, "pastikan sebelum ditaro ke vercel, Leaked Password Protection, Auth dan lain-lain sudah aman dan tidak breached dan leaked dan defensive terhadap attack dan malware." Audit menemukan tidak ada header keamanan sama sekali, karena `vercel.json` belum punya kunci `headers`.
  - Keadaan sebelumnya: satu satunya upaya pertahanan ada di `index.html`, yaitu `<meta http-equiv="X-Content-Type-Options" content="nosniff" />`. Meta itu tidak berefek karena `X-Content-Type-Options` hanya diakui sebagai header jawaban HTTP. Aturan `http-equiv` yang benar benar didukung peramban hanya `Content-Type`, `Refresh`, dan `Content-Security-Policy`.
  - Perubahan kode: `vercel.json` mendapat kunci `headers` dengan `source: "/(.*)"` yang mengirim `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`, `Strict-Transport-Security: max-age=63072000; includeSubDomains`, `Permissions-Policy` yang mematikan kamera, mikrofon, lokasi, pembayaran, dan USB, serta `Content-Security-Policy` dengan `script-src 'self'`, `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`, dan `form-action 'self'`. Meta yang tidak berlaku dihapus dari `index.html`; meta `referrer` tetap dipertahankan.
  - Kelonggaran yang disengaja: `img-src` memuat `https:` karena `global.profile.avatar` boleh berisi alamat gambar luar dan `blob:` untuk pratinjau unggahan. `style-src` memuat `'unsafe-inline'` karena Framer Motion dan React menulis gaya saat berjalan. `connect-src` dibatasi ke origin Supabase dan `verified-skill.com` saja, sesuai satu satunya pemanggilan jaringan yang ada di `src/`.
  - Verifikasi: `dist` disajikan ulang oleh peladen sementara dengan header yang dibaca langsung dari `vercel.json`, lalu enam halaman dibuka di Chrome headless lewat CDP. Hasil: 6 dari 6 header terkirim, nol sumber daya yang diblokir kebijakan, halaman tetap terender dengan isi penuh, dan font Bricolage Grotesque serta JetBrains Mono tetap termuat dari Google Fonts. `npx tsc --noEmit` keluar 0 dan `npm run build` berhasil. Berkas uji sementara sudah dihapus.
  - Status: Selesai.

- **Notifikasi Surel Formulir Kontak Bertema Situs**: pesan yang dikirim pengunjung dari halaman Kontak kini tiba di kotak masuk pemilik sebagai surel bertema Rust & Ink, bukan surel polos.
  - Kebutuhan: permintaan pemilik produk, "template email yang dari orang yang sudah mengetik di webapp kita saat masuk ke email kita itu ada templatenya juga."
  - Alur yang dipilih: peramban mengirim empat kolom ke `/api/contact`. Fungsi itu menyimpan pesan lebih dulu lewat RPC `portfolio_send_message` (security definer), baru meminta Resend mengirim salinannya. Urutan simpan lalu kirim dipilih supaya pengunjung tidak pernah diberi tahu "terkirim" bila satu satunya salinan hidup di kotak masuk yang ditelan gangguan penyedia. Balasan pemilik langsung menuju surel pengunjung lewat `reply_to`.
  - Perubahan kode: `api/contact.ts` baru, berisi validasi (nama 2 sampai 100, surel 5 sampai 200 dengan pola, pesan 20 sampai 5000), `renderEmail()` bertema Rust & Ink (tabel presentasional dengan gaya inline supaya selamat di Gmail dan Outlook), `renderText()` sebagai cadangan teks, dan penanganan yang membedakan galat simpan (502) dari kegagalan surel (tetap 200 dengan `emailed: false`). `src/lib/messages.ts` menambah `sendContactMessage()`. `src/pages/Contact.tsx` beralih dari tautan `mailto` yang sudah terisi subjek dan isi pesan ke pengiriman langsung, dengan blok "message received" dan "not delivered".
  - Aturan desain yang dipegang: aksen surel memakai `rust` untuk penanda perhatian, bukan `moss` yang khusus status positif dan terverifikasi; subjek surel tidak memakai em-dash.
  - Konfigurasi: `.env.example` menambah `RESEND_API_KEY`, `CONTACT_FROM_EMAIL`, dan `CONTACT_TO_EMAIL` tanpa awalan `VITE_`, karena awalan itu berarti "kirim ke peramban" dan kunci Resend adalah rahasia yang hanya boleh ada di sisi server.
  - Verifikasi: `npx tsc --noEmit` keluar 0, `npm run build` berhasil, dan `api/contact.ts` lolos kompilasi esbuild (7,5 kB keluaran, exit 0). Pengiriman surel sungguhan belum diuji karena variabel lingkungan Resend belum terisi di Vercel.
  - Status: Sebagian, menunggu pengisian variabel lingkungan Resend dan verifikasi domain pengirim lalu uji ujung ke ujung di produksi.

- **Tab Inbox dan Perbaikan Hak Akses Tabel Pesan**: panel admin kini dapat membaca pesan yang masuk, tidak lagi hanya bergantung pada surel.
  - Kebutuhan: melengkapi pengiriman kontak, sesuai permintaan pemilik produk agar pesan yang masuk juga terbaca di panel.
  - Perubahan kode: `src/admin/MessagesPanel.tsx` baru (daftar pesan, penanda belum dibaca, dialog detail, balas lewat surel, tandai dibaca, hapus), `src/pages/AdminDashboard.tsx` menambah tab `Inbox` sebagai tab ketiga, dan tiga migrasi `supabase/migrations/20260916000000_portfolio_messages.sql`, `20260916000100_portfolio_message_limits.sql`, serta `20260916000200_portfolio_message_grants.sql`.
  - Cacat yang ditemukan dan diperbaiki: tabel `portfolio_messages` sudah punya policy RLS, tetapi tidak punya `GRANT` di level tabel. Policy menentukan baris mana yang boleh disentuh, sedangkan tanpa grant peran `authenticated` ditolak sebelum policy pernah dievaluasi, sehingga tab Inbox pasti gagal membaca. Migrasi `20260916000200_portfolio_message_grants.sql` memberi `select, update, delete` kepada `authenticated`; peran `anon` sengaja tidak diberi, karena penulisan publik lewat fungsi security definer yang tidak memerlukan akses tabel.
  - Verifikasi: hak akses diperiksa langsung lewat SQL, hasilnya `authenticated` boleh `select`, `update`, dan `delete`, sedangkan `anon` tidak boleh ketiganya. Jalur tulis publik diuji sebagai peran `anon` (berhasil, sedangkan surel `ab@cd` ditolak `P0001: Invalid email address`), dan jalur baca admin diuji sebagai peran `authenticated` dengan klaim surel admin pada transaksi yang di-`rollback`, sehingga tabel kembali kosong.
  - Status: Selesai. Tab Inbox belum diuji dengan klik sungguhan di peramban; butir 9 pada bagian 12 masih terbuka.

- **Batas "Tanpa Pengiriman Kontak ke Server" Dicabut**: bagian ruang lingkup, FR-37, FR-39, dan butir 3 pada bagian 12 disesuaikan dengan kode nyata.
  - Alasan: PRD masih menyatakan formulir kontak "tidak punya tujuan" dan "tidak ada server yang menerima pesan", padahal sejak perubahan di atas pesan dikirim ke server, disimpan, dan dinotifikasikan. Membiarkannya berarti PRD berbohong tentang isi kode.
  - Perubahan dokumen: "Pengiriman formulir kontak ke server" dipindah dari daftar "tidak termasuk" ke "termasuk", ditambah catatan revisi bertanggal; FR-37 dan FR-39 diganti bunyinya agar sesuai perilaku baru; empat requirement baru ditambahkan, yaitu FR-76 (template surel bertema), FR-77 (titik akhir publik), FR-78 (kuota pengiriman), dan FR-79 (tab Inbox); butir 3 pada bagian 12 diganti menjadi batasan ketergantungan pada Resend dan status best effort surel.
  - Status: Selesai.

