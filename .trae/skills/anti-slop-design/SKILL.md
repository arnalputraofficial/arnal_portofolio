---
name: "anti-slop-design"
description: "Aturan desain visual portofolio Arnal (palet Rust & Ink, tipografi, motion, aturan kejujuran data) beserta daftar larangan tampilan generik. Invoke saat membuat atau mengubah UI, memilih warna/tipografi, atau menilai apakah hasil terlihat seperti template AI."
---

# Aturan Desain Anti-Slop

Requirement pemilik proyek: situs harus terasa seperti karya seorang IT Lead yang berpengalaman,
**bukan** template portofolio generik hasil generator. Skill ini adalah hukum visualnya.

## 1. Gagasan desain

Tema **"Rust & Ink"**: dasar tinta hangat, aksen karat dan lumut.
Situs dirender gelap secara bawaan (`<html class="dark">`), dengan mode terang tersedia lewat `ThemeToggle`.

Kesan yang dituju: dokumen kerja lapangan yang rapi. Padat, jujur, sedikit kasar di tepi,
bukan landing page SaaS yang mengkilap.

## 2. Palet

Palet kustom, bukan slate/zinc. Tersedia sebagai token Tailwind (`ink`, `rust`, `moss`, skala 50-950)
dan token semantik berbasis CSS variable (shadcn-compatible).

Aturan pemakaian warna:
- `primary` (rust) hanya untuk aksi utama dan penanda aktif. Bukan untuk dekorasi.
- `moss` untuk status positif/terverifikasi, bukan untuk aksen kedua yang bersaing.
- `danger` khusus kesalahan, biaya, atau hal yang gagal.
- Warna grafik wajib dari `CHART_COLORS` di `src/components/charts/ChartFrame.tsx`.
  Jangan menulis kode hex baru di dalam komponen grafik.
- Jangan memakai gradien ungu-ke-biru, atau kombinasi `#6366f1` + `#a855f7`, atau apa pun yang menyerupai tema bawaan Tailwind UI.

## 3. Tipografi

Tiga peran, sudah dimuat di `index.html`:
- `font-display` -> Bricolage Grotesque. Untuk judul besar.
- `font-sans` -> Inter. Untuk badan teks.
- `font-mono` -> JetBrains Mono. Untuk label angka, kode, dan metadata.

Aturan:
- Label kecil gaya mesin memakai `.eyebrow` dan dipakai **hemat**, bukan di setiap seksi.
- Angka yang perlu diperbandingkan memakai `font-mono` + `tabular-nums`.
- Jangan memakai huruf kapital semua untuk kalimat panjang.

## 4. Bahasa visual yang sudah menjadi identitas

Pakai berulang supaya situs terasa satu naskah:
- `.panel-flagged` (garis aksen kiri) untuk blok yang ingin ditonjolkan. Ini penanda visual utama.
- `.grid-lines` sebagai latar pada header atau seksi pembuka, tidak di mana mana.
- `.text-outline` untuk satu angka atau kata raksasa, tidak lebih dari satu per halaman.
- `.hairline` dan `Separator dashed` untuk pemisahan, sebagai alternatif kartu.
- Nomor seksi bergaya `01`, `02` dari `SectionHeading` dan `PageIntro`.
- Sudut: `rounded-blob` untuk wadah ekspresif, `rounded-notch` untuk input dan tombol. Jangan mencampur dengan `rounded-md` biasa.

## 5. Gerak dan interaksi

- Semua animasi masuk memakai `Reveal`, `RevealGroup`, `RevealItem`, `SplitHeading` dari `src/components/fx/Reveal.tsx`.
- Transisi antar halaman sudah diurus `PageShell` di `App.tsx`. Jangan menambahkan pembungkus motion baru di level halaman.
- Easing baku: `ease-out-expo` (`cubic-bezier(0.16, 1, 0.3, 1)`). Durasi 0.2 sampai 0.45 detik.
- Wajib menghormati `prefers-reduced-motion`. Bila menambah animasi manual, bungkus dengan `useReducedMotion()` dari framer-motion.
- Setiap aksi pengguna harus punya umpan balik visual: hover, focus, active, dan status. Ini requirement eksplisit pemilik proyek.

## 6. Aksesibilitas (bagian dari definisi selesai, bukan tambahan)

- `:focus-visible` harus terlihat. Jangan pernah `outline: none` tanpa pengganti.
- Tabel: `aria-sort` pada header yang bisa diurutkan.
- Status dinamis: `role="status"` untuk informasi, `role="alert"` untuk kesalahan.
- Formulir: `aria-invalid` dan `aria-describedby` yang menunjuk ke pesan error.
- Tombol ikon wajib punya `aria-label`.

## 7. Aturan kejujuran data (pembeda utama dari situs portofolio lain)

Situs ini menampilkan keterbatasan, bukan hanya pencapaian. Pertahankan polanya:
- Angka penilaian mandiri harus **dipisahkan tegas** dari angka registry pihak ketiga.
- Bila registry tidak terjangkau, tampilkan status `offline` apa adanya, dengan alasan teknis.
  Dilarang menampilkan angka verifikasi karangan.
- Setiap halaman menyertakan satu blok kejujuran: keahlian yang jarang dipakai, kesalahan beserta biayanya, atau hal yang belum selesai.
- Jangan menaikkan angka agar lebih meyakinkan. Data contoh harus ditandai sebagai contoh.

## 8. Daftar larangan keras

1. **Em-dash (—) pada teks yang terlihat pengguna.** Gunakan koma, titik, atau "to". Ini berlaku untuk UI, `title` halaman, meta description, dan label grafik. Komentar kode boleh memakainya.
2. Gradien ungu/biru khas template AI, atau glow neon.
3. Grid kartu seragam tiga kolom yang isinya ikon + judul + dua baris teks, berulang tanpa variasi.
4. Ikon dekoratif yang tidak menambah makna.
5. Emoji di antarmuka.
6. Teks pemasaran kosong seperti "solusi inovatif" atau "berpengalaman dan profesional" tanpa angka pendukung.
7. Animasi yang membuat pengguna menunggu, atau motion yang berjalan terus tanpa manfaat.
8. Menambah kelas CSS baru sebelum memeriksa `src/index.css`. Kelas yang tidak ada akan diam diam tidak berlaku dan merusak tampilan.

## 9. Cara memeriksa hasil sendiri sebelum menyatakan selesai

1. Apakah halaman baru ini bisa dibedakan dari template portofolio biasa? Kalau tidak, ganti komposisinya.
2. Apakah ada blok kejujuran di halaman itu?
3. Apakah semua warna berasal dari token, bukan hex baru?
4. Apakah setiap kelas CSS yang dipakai memang ada di `src/index.css`?
5. Apakah ada em-dash di teks yang tampil?
6. Apakah tampilan masih benar di mode terang dan di layar sempit?
7. Apakah semua teks baru berbahasa Inggris? Situs ini satu bahasa, tanpa lapisan i18n.
