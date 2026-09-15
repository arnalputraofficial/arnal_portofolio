---
name: "prd-guardian"
description: "Menjaga docs/PRD.md tetap sinkron dengan kode: mencatat fitur baru, perubahan requirement, dan keputusan teknis ke PRD beserta changelog. Invoke setiap kali pengguna menambah atau mengubah fitur, atau meminta perubahan requirement."
---

# Penjaga PRD

Permintaan pemilik proyek: **setiap penambahan fitur harus masuk ke PRD.**
Skill ini memastikan hal itu terjadi tanpa diminta ulang, dan memastikan PRD tidak berbohong tentang isi kode.

Berkas yang dijaga: `docs/PRD.md`.

## Aturan pokok

1. Setiap fitur baru, perubahan requirement, atau keputusan teknis yang mengikat **wajib** tercatat di PRD pada giliran yang sama.
2. Yang dicatat adalah keadaan sebenarnya. Fitur yang belum selesai ditulis sebagai belum selesai, bukan dihilangkan dan bukan ditulis seolah selesai.
3. PRD ditulis dalam Bahasa Indonesia, sejalan dengan bahasa proyek.
4. Jangan memakai em-dash pada PRD? Boleh, karena PRD bukan antarmuka. Namun tetap utamakan kalimat lugas.

## Struktur PRD yang dipakai

`docs/PRD.md` disusun dengan urutan berikut. Jangan mengubah urutannya tanpa alasan kuat.

1. **Ringkasan Produk** — masalah, sasaran, dan siapa yang memakai.
2. **Sasaran dan Ukuran Keberhasilan** — hal yang bisa diperiksa, bukan slogan.
3. **Persona** — minimal pemilik portofolio (IT Lead/SPV) dan perekrut atau manajer teknik.
4. **Ruang Lingkup** — apa yang termasuk dan yang sengaja tidak termasuk.
5. **Requirement Fungsional** — diberi kode `FR-n`, masing masing punya status.
6. **Requirement Non Fungsional** — performa, aksesibilitas, kejujuran data, kompatibilitas. Diberi kode `NFR-n`.
7. **Requirement Teknis dan Teknologi** — pustaka wajib, dengan catatan versi dan alasan.
8. **Arsitektur Informasi** — daftar rute dan isi halaman.
9. **Model Data** — ringkasan bentuk data dan relasinya.
10. **Desain dan Bahasa Visual** — arah desain dan larangan.
11. **Status Implementasi** — tabel requirement terhadap keadaan nyata.
12. **Batasan dan Utang Teknis** — hal yang diketahui belum ideal.
13. **Risiko dan Mitigasi**.
14. **Di Luar Ruang Lingkup**.
15. **Riwayat Perubahan** — changelog bertanggal, terbaru di atas.

## Status yang dipakai

Setiap requirement memakai salah satu label ini, tanpa variasi lain:
- `Selesai` — sudah ada di kode dan sudah diverifikasi.
- `Sebagian` — ada di kode tetapi belum lengkap atau belum diverifikasi.
- `Belum` — direncanakan tetapi belum ada di kode.
- `Ditunda` — sengaja tidak dikerjakan, dengan alasan.
- `Ditolak` — dipertimbangkan lalu tidak diambil, dengan alasan.

Dilarang menandai `Selesai` untuk sesuatu yang belum diperiksa. Jalankan skill `verify-before-done` lebih dulu bila ragu.

## Cara mencatat fitur baru

Saat pengguna meminta fitur tambahan:

1. **Tentukan dulu apakah ini requirement baru atau perubahan requirement lama.**
   - Baru: tambahkan `FR-n` berikutnya di bagian 5, dengan status sebenarnya.
   - Perubahan: ubah entri yang ada, dan **jangan** menghapus jejak bahwa requirement itu pernah berbeda. Catat perubahannya di changelog.
2. Periksa dampaknya ke bagian lain: ruang lingkup, model data, arsitektur informasi, batasan, risiko.
3. Tambahkan entri di bagian 15 dengan format:

```markdown
### YYYY-MM-DD
- **FR-14 Ditambahkan**: <nama fitur singkat>
  - Kebutuhan: <mengapa diminta>
  - Perubahan kode: <daftar berkas yang disentuh>
  - Status: <Selesai | Sebagian | Belum>
```

4. Bila fitur itu menambah berkas, ekspor, atau prop baru, perbarui juga skill `project-map`.
5. Bila fitur itu mengubah tampilan, pastikan tetap sesuai skill `anti-slop-design`.

## Saat ragu apakah sebuah perubahan perlu dicatat

Perlu dicatat bila memenuhi salah satu:
- mengubah apa yang bisa dilakukan pengguna;
- mengubah bentuk data;
- menambah atau menghapus halaman atau rute;
- menambah pustaka baru;
- mengubah keputusan yang sudah tertulis di PRD.

Tidak perlu dicatat bila murni perbaikan internal tanpa efek ke luar, misalnya memperbaiki salah tulis komentar.
Namun bila perbaikan itu menyangkut keputusan yang tertulis di PRD, tetap catat.

## Larangan

- Membuat berkas PRD kedua di lokasi lain. Hanya `docs/PRD.md` yang berlaku.
- Menulis fitur sebagai selesai padahal belum dijalankan atau belum dibuat.
- Menghapus bagian PRD tanpa persetujuan pengguna.
- Mengubah PRD hanya agar cocok dengan kode yang salah. Perbaiki kodenya, atau nyatakan penyimpangannya secara terbuka di bagian Batasan.
