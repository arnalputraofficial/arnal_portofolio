---
name: "verify-before-done"
description: "Langkah wajib sebelum menyatakan tugas portofolio Arnal selesai: cek tipe, build produksi, dan verifikasi runtime di browser. Invoke setiap kali selesai mengubah kode, sebelum melaporkan hasil ke pengguna."
---

# Verifikasi Sebelum Menyatakan Selesai

Di proyek ini, "kode sudah ditulis" bukan berarti "pekerjaan selesai".
TypeScript ketat, dan sebagian kesalahan hanya muncul saat runtime (khususnya WebGL dan panggilan jaringan).

## Aturan pokok

**Dilarang** menyatakan tugas selesai, atau menulis "sudah beres", sebelum langkah di bawah dijalankan
dan hasilnya disebutkan apa adanya. Bila ada langkah yang gagal atau tidak dijalankan, katakan terus terang.

## Langkah 1: periksa tipe

```
npx tsc --noEmit -p tsconfig.json
```

Exit code harus 0. Karena `noUnusedLocals` aktif, error paling sering berupa import yang tidak terpakai.
Hapus import itu, jangan matikan flag-nya.

## Langkah 2: build produksi

```
npm run build
```

Ini menjalankan `tsc -b` lalu `vite build`. Build harus selesai tanpa error.
Warning yang diketahui dan boleh dilaporkan tanpa panik:
- peringatan ukuran chunk di atas 500 kB (penyebab: `three` dan `recharts` masuk bundle awal);
- peringatan recharts 2.15 deprecated;
- peringatan postinstall esbuild yang belum disetujui.

Jangan mengakali peringatan dengan menaikkan `chunkSizeWarningLimit`. Bila ukuran bundle ingin diperbaiki,
lakukan dengan pemecahan kode yang nyata (`React.lazy` atau `manualChunks`), dan mintakan persetujuan pengguna lebih dulu.

## Langkah 3: verifikasi runtime

1. Jalankan `npm run dev` sebagai perintah non blocking.
2. Tunggu sampai muncul `Local: http://localhost:5173/`.
3. Uji dengan permintaan HTTP:
   ```
   try { $r = Invoke-WebRequest -Uri "http://localhost:5173/" -UseBasicParsing -TimeoutSec 15; "STATUS: $($r.StatusCode)"; $r.Content } catch { "ERR: $($_.Exception.Message)" }
   ```
   Harapan: `STATUS: 200`.
4. Cek keluaran terminal dev server. Tidak boleh ada error baru.
5. Untuk perubahan visual, buka halaman di browser dan periksa langsung. Perubahan tata letak, WebGL, dan grafik
   tidak dapat dipercaya hanya dari pembacaan kode.

## Langkah 4: cek hal yang mudah terlewat di proyek ini

- Halaman yang mengimpor `HeroScene` atau komponen recharts benar benar tampil (bukan kanvas kosong).
- Halaman Keahlian tetap menampilkan status `offline` dengan benar saat jaringan diblokir, bukan layar kosong atau angka palsu.
- Mode terang dan gelap sama sama terbaca.
- Tautan `mailto:` pada halaman Kontak terbentuk benar.
- Rute yang tidak dikenal tetap menampilkan halaman 404, bukan layar putih.

## Langkah 5: perbarui catatan

Bila perubahan menyentuh requirement, kemampuan, atau struktur berkas:
- catat di `docs/PRD.md` sesuai skill `prd-guardian`;
- perbarui skill `project-map` bila ada berkas, ekspor, atau prop yang berubah.

## Format laporan ke pengguna

Sebutkan secara ringkas dan faktual:
- hasil `tsc` (0 error atau daftar error);
- hasil `npm run build` (sukses atau gagal, beserta ukuran berkas bila relevan);
- status dev server dan URL;
- apa yang sudah diverifikasi di browser, dan apa yang belum;
- batasan yang diketahui.

Jangan memakai kata "sempurna", "pasti berhasil", atau "tanpa masalah" tanpa bukti dari langkah di atas.
