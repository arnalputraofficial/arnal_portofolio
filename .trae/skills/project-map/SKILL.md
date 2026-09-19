---
name: "project-map"
description: "Peta akurat proyek portofolio Arnal: daftar file, export, prop, token desain, model data, dan alur render. Invoke SEBELUM mengubah atau menambah kode apa pun di repo ini, agar tidak perlu menelusuri ulang file satu per satu."
---

# Peta Proyek arnal-portofolio

Tujuan skill ini: agen tidak perlu membaca ulang belasan file setiap kali ada tugas.
Baca file ini dulu; baru buka file asli hanya untuk bagian yang benar benar akan diubah.

> Aturan: bila isi file di bawah berubah, **perbarui skill ini pada waktu yang sama**.
> Peta yang basi lebih berbahaya daripada tidak ada peta.

## 1. Stack dan versi nyata

| Hal | Nilai | Catatan |
|---|---|---|
| Vite | 6.4.3 | `vite.config.ts` hanya punya plugin react + alias |
| React | 18.3.1 | bukan React 19 |
| TypeScript | ~5.7.3 | `strict: true` |
| Tailwind | 3.4.17 | `darkMode: ["class"]` |
| recharts | 2.15 | **bukan** v3, API lama |
| @tanstack/react-table | 8.21 | |
| framer-motion | 12.x | import dari `"framer-motion"` |
| @react-three/fiber | 8.18 | three 0.174 |
| lucide-react | 0.479 | |
| react-router-dom | 7.3 | |
| @supabase/supabase-js | 2.x | publishable key `sb_publishable_*`, aman dipublikasikan |
| @react-three/drei | **tidak terpasang** | jangan pernah `import` dari paket ini |

Skrip:
- `npm run dev` -> vite, port 5173
- `npm run build` -> `tsc -b && vite build`
- `npm run preview` -> vite preview

Berkas di akar repo (selain konfigurasi build): `.env.example`, `.gitignore`, `vercel.json`.
`vercel.json` menetapkan `framework: "vite"`, `buildCommand: "npm run build"`,
`outputDirectory: "dist"`, dan `rewrites` dari `/(.*)` ke `/index.html`. Aturan pengalihan itu
wajib ada karena `src/main.tsx` memakai `BrowserRouter`: tanpa itu, membuka `/projects` langsung
atau menyegarkan halaman di sana menghasilkan 404 dari hosting. Rewrite hanya berlaku bila tidak
ada berkas statis yang cocok, jadi aset `dist/assets/` tetap tersaji normal.
`vercel.json` juga memuat kunci `headers` untuk `/(.*)`: `X-Content-Type-Options`, `Referrer-Policy`,
`X-Frame-Options`, `Strict-Transport-Security`, `Permissions-Policy`, dan `Content-Security-Policy`.
Kebijakan itu hanya berlaku sebagai header jawaban, jadi mengubahnya tidak terasa di
`npm run dev` maupun `npm run preview`; uji ulang harus menyajikan `dist/` dengan header yang sama.
Satu kelonggaran disengaja: `img-src` memuat `https:` supaya alamat gambar luar pada
`global.profile.avatar` tetap tampil, dan `connect-src` dibatasi ke origin Supabase serta
`verified-skill.com`. Menambah pemanggilan jaringan ke origin baru berarti `connect-src` harus
ikut disunting, kalau tidak permintaannya diblokir di produksi.

## 2. Konfigurasi TypeScript (penting, mudah bikin error)

Hanya ada **satu** `tsconfig.json`. Tidak ada `tsconfig.app.json` maupun `tsconfig.node.json`.
Membuat `tsconfig.app.json` akan melanggar `tsc -b` (error TS5058).

Flag ketat yang aktif: `strict`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`.

Konsekuensi praktis:
- Setiap `import` yang tidak terpakai adalah **error build**, bukan sekadar warning.
- Setiap parameter fungsi yang tidak dipakai juga error. Hapus atau awali `_`.
- Alias path: `@/*` -> `./src/*` (hanya `baseUrl: "."`, tanpa `rootDir`).
- `include` hanya `["src", "vite.config.ts"]`, sehingga `api/contact.ts` **tidak** ikut `tsc`. Periksa berkas itu dengan `npx esbuild api/contact.ts --outfile=nul`. Jangan menambahkan `--loader=ts`: opsi itu hanya berlaku saat membaca dari stdin dan gagal dengan pesan `"loader" without extension only applies when reading from stdin`, bukan karena berkasnya salah.

## 3. Struktur file dan export

### `src/main.tsx`
Entry React. Merender `<App />` ke `#root`.

### `src/App.tsx`
- Export default `App`.
- `TooltipProvider` -> `ContentProvider` -> `EntriesProvider` -> `AdminAuthProvider` -> `SiteHeader` -> `AnimatePresence mode="wait" initial={false}` -> `PageShell` -> `Routes` -> `SiteFooter`.
- `PageShell` lokal: `motion.main` opacity 0/y 12 -> 1/0, exit y -8, `duration 0.38`, `ease [0.16, 1, 0.3, 1]`, `className="relative z-10"`.
- Rute publik: `/` Home, `/career` Career, `/projects` Projects, `/credentials` Credentials, `/skills` Skills, `/about` About, `/contact` Contact, `*` NotFound. Semua rute memakai kata Inggris.
- Rute admin: `/admin/login` AdminLogin, `/admin/forgot-password` AdminForgotPassword, `/admin/reset-password` AdminResetPassword, dan `/admin` dibungkus `RequireAdmin` -> AdminDashboard.
- `RequireAdmin` lokal: membaca `useAdminAuth()`. `status === "loading"` -> kartu pemuatan; `"signed-out"` -> `Navigate to="/admin/login" replace`; selain itu merender anak.
- Provider: keduanya dipasang di dalam `App.tsx`, bersarang `TooltipProvider` > `ContentProvider` > `AdminAuthProvider`.
- `App` memisahkan tampilan pada `location.pathname.startsWith("/admin")`, sehingga panel tidak pernah muncul di bawah header situs, dan halaman 404 publik tidak menelan alamat admin.
- Tiap halaman di-import statis (bukan lazy).

### Halaman `src/pages/` (11 berkas, semua `export default`)

| Berkas | Rute | Isi pokok |
|---|---|---|
| `Home.tsx` | `/` | Hero + `HeroScene` 3D + ringkasan + sorotan |
| `Career.tsx` | `/career` | Timeline karier + `CareerCharts` + `CareerTable` |
| `Projects.tsx` | `/projects` | Sorotan proyek + `ProjectCharts` + `ProjectTable` |
| `Credentials.tsx` | `/credentials` | Masa berlaku sertifikat + recharts langsung + `CertificationTable` + `CertificateSlideshow` |
| `Skills.tsx` | `/skills` | Radar/bar skill + penilaian mandiri skala 1-5 + `RegistryPanel` (verified-skill) |
| `About.tsx` | `/about` | Cara kerja, prinsip, kesalahan beserta biaya, FAQ |
| `Contact.tsx` | `/contact` | Formulir tervalidasi, salin pesan, `mailto:` |
| `Steadbyte.tsx` | `/about-steadbyte` | Halaman informasi tentang situs ini sendiri: ringkasan + status, masalah yang dipecahkan, peran dan keputusan teknis, catatan kejujuran |
| `NotFound.tsx` | `*` | 8 rute nyata + saran proyek dampak tertinggi |
| `AdminLogin.tsx` | `/admin/login` | Satu satunya jalan masuk panel. Tiga cabang: memuat, wajib ganti kata sandi, formulir masuk |
| `AdminForgotPassword.tsx` | `/admin/forgot-password` | Form request link pemulihan kata sandi admin via Supabase Auth |
| `AdminResetPassword.tsx` | `/admin/reset-password` | Form ganti sandi baru setelah membuka token pemulihan dari email |
| `AdminDashboard.tsx` | `/admin` | Panel bertab: `Content` (`ContentEditor`), `Entries` (`EntriesPanel`), `Inbox` (`MessagesPanel`), `Revisions` (`HistoryPanel`), `Account` (`PasswordForm`) |

Berkas admin yang bukan halaman: `src/admin/RequireAdmin.tsx`, `src/admin/AdminAuthProvider.tsx`,
`src/admin/PasswordForm.tsx`, `src/admin/ContentEditor.tsx`, `src/admin/EntriesPanel.tsx`,
`src/admin/HistoryPanel.tsx`, `src/admin/useAdminData.ts`.

### Komponen `src/components/`

**`layout/`**
- `PageIntro.tsx` -> `PageIntro({ index, eyebrow, title, lead?, children? })`, `StatStrip({ items, className })`.
  `items` = `{ label: string; value: React.ReactNode; hint?: string }`. **Tidak ada field `icon`.**
- `SectionHeading.tsx` -> `SectionHeading({ index, eyebrow?, title, description?, className?, action? })`, `PageSection({ children, className?, id? })`.
  `title` dan `description` bertipe `React.ReactNode`, bukan `string`.
- `SiteHeader.tsx` -> `SiteHeader()`, plus konstanta `navItems` (dipakai juga oleh `SiteFooter`).
- `SiteFooter.tsx` -> `SiteFooter()`. `ScrollToTop.tsx` -> `ScrollToTop()`.

**`charts/`**
- `ChartFrame.tsx` -> `ChartFrame({ title: string, note?: string, action?: React.ReactNode, children, className?, legend?: { label: string; color: string }[] })`.
  Body dibungkus `<div className="mt-5 pl-2">`, jadi konten grafik otomatis punya lekuk kiri. Jangan menambah padding kiri lagi.
  `TooltipShell({ title: React.ReactNode, rows: { label: string; value: React.ReactNode; color?: string }[] })`.
  `AxisTick({ x?, y?, payload?, fill? })`.
  `CHART_COLORS` = rust `#e2704a`, rustDeep `#b83d1c`, moss `#6a9364`, mossDeep `#3b5e39`, bone `#f0ebe3`, dim `#6f5e4d`, plus `grid` dan `axis`.
- `CareerCharts.tsx` -> `CareerTenureChart()`, `RoleScopeScatter()`.
- `ProjectCharts.tsx` -> `ProjectMap()`, `BudgetImpactChart()`, `BudgetImpactScatter()`.
  - `ProjectMap` menghitung `yearDomain` dari data yang ada (`React.useMemo`) dan meneruskannya ke `XAxis domain`, dengan `tickCount` dibatasi 3 sampai 14. Sumbu tahun sebelumnya dipaku pada rentang tetap, sehingga tahun di luar rentang itu hilang dari grafik.
  - `BudgetImpactChart` memakai `const { projects, curve } = useEntries()`. Bila `curve.length > 0`, bar memakai `budgetM` manual dan garis memakai `impact` manual, sedangkan `count` tetap dihitung dari proyek pada tahun itu. Bila `curve` kosong, grafik jatuh ke agregasi `projects`. Penanda `manual` mengganti label tooltip (`projects.chart.row.budget` dan `projects.chart.row.impact` vs `projects.chart.row.totalBudget` dan `projects.chart.row.avgImpact`).
  - `BudgetImpactScatter` menghitung `impactDomain` dari data (dibulatkan ke kelipatan 5, dijepit 0 sampai 100).
- `SkillCharts.tsx` -> `SkillBalanceRadar({ data })`, `TopSkillsBar({ data, limit = 10 })`, `StackUsageChart()`, `ExperienceSpreadChart()`.
  Hanya `SkillCharts` dan `ChartFrame` yang menerima prop; sisanya mengambil data dari `@/data/portfolio` langsung.
  `SKILL_SCALE_MAX = 5` dipakai di `SkillCharts.tsx` dan `Skills.tsx`. Radar menggambar `level` sebagai proporsi (`level / 5 * 100`) supaya satu sumbu 0-100 tetap dipakai bersama seri evidence, sedangkan label tetap dalam perlimaan lewat `levelOf5`. `TopSkillsBar` memakai `domain={[0, 5]}` dengan tick 1-5. Ambang warna: `>= 4` kuat, `>= 3` sedang, sisanya rendah.

**`fx/` (animasi dan efek)**
- `Reveal.tsx` -> `Reveal({ children, className, delay = 0, y = 18, as = "div" })` dengan `as` hanya boleh `"div" | "section" | "li" | "article"`.
  `RevealGroup({ children, className, stagger = 0.07 })`, `RevealItem({ children, className, y = 16 })`, `SplitHeading({ text, className, delay = 0 })`.
- `Counter.tsx` -> `Counter({ value, duration = 1.4, decimals = 0, prefix = "", suffix = "", className })`.
- `SpotlightCard.tsx` -> `SpotlightCard({ className, children, spotlightColor = "rgba(213, 81, 40, 0.16)", ...divProps })`.
- `Marquee.tsx` -> `Marquee({ items, className?, reverse = false, speed = 38 })`. `items` selalu berupa larik jadi, tidak pernah dibaca sendiri dari registry.
  - Dipakai `Home.tsx` dengan `home.stack.marquee` (nama lama `rollingStack`), dan `SiteFooter.tsx` dengan `footer.rollingStrip`.
  - Keduanya membaca kunci daftar lewat `t(key).split("\n").map(trim).filter(Boolean)`. Strip Beranda jatuh ke `[...new Set(career.flatMap((role) => role.stack))].slice(0, 22)` bila kunci itu kosong; strip footer tidak punya sumber turunan.
  - Keduanya tidak dirender sama sekali bila daftarnya kosong, supaya tidak muncul pita kosong setinggi `py-3.5`.
- `MagneticButton.tsx` -> `MagneticButton({ children, className, strength = 8, ...buttonProps })`. **Belum dipakai di halaman mana pun.**
- `CursorAura.tsx` -> `CursorAura()` tanpa prop. Kursor kustom bernuansa reticle, dipasang sekali di `App.tsx` sehingga berlaku di semua rute termasuk `/admin`.
  - Tiga lapisan: aura radial 520 px yang mengikuti pointer dengan pegas lambat, braket empat sudut 44 px yang juga menyusul pointer, dan crosshair yang menempel tepat pada pointer tanpa jeda.
  - Braket 26 px saat menganggur, 18 px saat terkunci pada sasaran, 14 px saat tombol ditekan. Titik tengah crosshair 3 px, menjadi 5 px saat ditekan. Warna seluruhnya dari token `primary`, jadi ikut tema.
  - Label mono muncul di samping braket saat kursor di atas sasaran. `targetTag(el)` menentukan namanya: atribut `data-cursor` menang, lalu `role` (`switch` -> `TOGGLE`, `tab` -> `TAB`, `menuitem` -> `MENU`), lalu nama tag (`LINK`, `BUTTON`, `FIELD`, `SELECT`, `EXPAND`, sisanya `ACT`). Konstanta `INTERACTIVE_SELECTOR` menentukan apa yang dianggap sasaran.
  - Aktif hanya bila `(pointer: fine)` dan `prefers-reduced-motion` tidak diminta. Saat aktif, kelas `cursor-reticle` dipasang di `<html>`; kelas itulah yang menyembunyikan kursor bawaan (lihat bagian 4).
  - Posisi digerakkan `useMotionValue` + `useSpring`, bukan state, karena `pointermove` terlalu sering. Status terkunci dan tertekan disimpan di ref lalu disalin ke state hanya saat berubah.
- `ScrollProgress.tsx`.
- `ThemeToggle.tsx` -> `ThemeToggle({ className? })`. Sakelar tema `role="switch"` berisi ikon saja (tanpa teks LIGHT/DARK) agar lebar tetap 56 px. Knob 24 px menggeser 24 px dan berada di belakang ikon, sehingga ikon aktif terlihat sebagai bentuk terpotong dari knob. Matahari di kiri, bulan di kanan; knob berada di sisi ikon yang aktif (gelap = kanan). Mode disimpan di `localStorage` kunci `arnal:theme`.

**`three/`**
- `HeroScene.tsx` -> `HeroScene({ className, skills? })`. Canvas 3D kluster node topologi skill. Membaca data skill nyata dari `useEntries()` (atau `skills` prop) dan memetakan node ke skill. Node bersifat interaktif: dapat diputar lewat drag, dan diklik untuk menampilkan kartu inspeksi skill (nama, kategori, level 1-5, tahun pengalaman, tahun mulai atau `since`, serta tautan ke `/skills`). Dipakai di `Home.tsx`.
  - Interaksi kartu node. Konstanta `CARD_ANIM_MS = 180` (durasi animasi masuk dan keluar) dan `CARD_EXIT_MS = 200` (saat kartu benar-benar dilepas, sedikit lebih lama agar animasi keluar selalu tuntas). Kartu memakai `animate-in fade-in zoom-in-95` / `animate-out fade-out-0 zoom-out-95` dengan `animationDuration` inline dan `key` per skill supaya animasi masuk selalu terulang dari frame pertama.
  - Fungsi kunci di dalam komponen: `openCard(skill)`, `closeCard(next = null)` (menjalankan animasi keluar lalu membuka `next` bila ada), `selectSkill(skill)` (node yang sama membiarkan kartu terbuka, node lain menutup kartu lama lebih dulu), `onCanvasClick()`, dan `handleHover(i)`. Penanda `nodeHit` mencegah klik node dibaca sebagai klik luar; `hoveredRef` adalah cermin `hovered` untuk loop animasi.
  - Penutupan: klik kiri di luar area kluster (`rootRef`) lewat listener `pointerdown` di `document`, klik kanvas yang tidak mengenai node, klik node lain, dan tombol tutup.
  - Rotasi otomatis kluster dibekukan selama kursor berhenti di atas node (`hoveredRef.current !== null`) dan spin tambahan saat kartu terbuka hanya jalan bila tidak ada node ter-hover. Tanpa ini node bergeser antara `pointerdown` dan `click` sehingga klik gagal membuka kartu.
  - Ukuran node: skala dasar `0.082 + level/5 × 0.05` (level 1-5, diameter di layar sekitar 14–23 px pada kanvas 404×420). Angka ini sengaja dijaga besar karena node sekaligus menjadi sasaran klik. Skala saat ter-hover atau terpilih `1.8×`. Jika ukuran ini diubah, uji ulang keterjangkauan klik: node yang terlalu kecil sulit ditemukan oleh sapuan uji otomatis dan sulit diklik pengguna.
  - Wadah kluster memakai atribut `data-cursor` bernilai `DRAG`, `NODE`, atau `GRAB` mengikuti keadaan seret dan hover. Atribut ini dibaca `CursorAura` supaya kemampuan yang dulu dibawa kursor bawaan tetap ada walau kursor bawaan disembunyikan. Kelas `cursor-grab` / `cursor-pointer` / `cursor-grabbing` tetap ada untuk perangkat yang tidak memakai reticle.
  - Catatan jebakan: kelas `duration-*` Tailwind hanya mengatur `transition-duration`, sedangkan `.animate-out` bawaan `tailwindcss-animate` memakai 150 ms; durasi animasi kartu diatur lewat `animationDuration` inline.

**`tables/`**
- `DataTable.tsx` generik (TanStack Table v8) + `CareerTable.tsx`, `CertificationTable.tsx`, `ProjectTable.tsx`.
- `src/types/tanstack-table.d.ts` berisi augmentasi tipe untuk tabel.

**Akar `src/components/`**
- `CertificateSlideshow.tsx` -> `CertificateSlideshow()`. Tanpa prop; mengambil `certifications` dan `scansFor()` dari `useEntries()`. Merender seksi `04 Scans` berisi grup per sertifikat, plus viewer layar penuh (`fixed inset-0 z-[70]`, `role="dialog"`, `aria-modal`). **Mengembalikan `null` bila tidak ada scan sama sekali**, jadi halaman Credentials tidak berubah selama pemilik belum mengunggah apa pun.
  - Menutup dengan Escape, menelusuri dengan panah kiri/kanan, memindahkan fokus ke overlay saat dibuka dan mengembalikannya ke elemen pemanggil saat ditutup, serta mengunci gulir `body` selama terbuka.
  - Daftar datar `slides` + `offset` per grup membuat navigasi papan tik menelusuri seluruh scan halaman dengan urutan yang sama seperti tampilannya.

**`ui/` (pola shadcn/ui: Radix + CVA + `cn()`)**
`accordion`, `badge`, `button`, `card`, `dialog`, `input`, `progress`, `select`, `separator`, `table`, `tabs`, `tooltip`.

Nama ekspor dan varian penting:
- `button.tsx`: `Button` dengan variant `default | outline | ghost | solid | link`, size `default | sm | lg | icon`, prop `asChild`.
- `badge.tsx`: `Badge` + `type BadgeProps`, variant `default | accent | moss | solid | outline | danger | muted`, size `default | sm`, prop `dot`.
- `progress.tsx`: `Progress` dengan prop tambahan `indicatorClassName`.
- `separator.tsx`: `Separator` dengan prop `dashed`.
- `tabs.tsx`: `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`.
- `accordion.tsx`: `Accordion`, `AccordionItem`, `AccordionTrigger`, `AccordionContent` (ikon Plus berputar saat terbuka).

### `src/lib/`
- `utils.ts` -> `cn(...inputs)`, `nf(value, digits = 0)` (format angka `en-US`), `monthRange(start, end)` (menghasilkan `"Mar 2021 to Now"`), `monthsBetween(start, end)`, `humanDuration(months)`, `parseStyledLines(value)` (memecah nilai per baris dan menandai baris yang diapit `*...*` sebagai bergaya), `mailtoHref(address)` (membuang spasi dan awalan `mailto:`, lalu mengembalikan `mailto:...`; mengembalikan `""` bila tidak memuat `@`).
- `paste.ts` -> pembacaan tabel yang ditempel ke panel, tanpa React dan tanpa basis data:
  - `splitPastedLine(line)` memecah satu baris; pemisahnya tab, pipa, atau koma; tanda kutip ganda menahan pemisah di dalamnya.
  - `pastedNumber(cell: string): number | null` membaca angka gaya spreadsheet dengan aturan tetap. Pemisah yang diikuti tepat tiga digit dianggap pemisah ribuan (`"1.450"` dan `"1,450"` sama-sama `1450`), sisanya dianggap titik desimal (`"1,45"` dan `"1.45"` sama-sama `1.45`). Negatif dibaca dari `^\s*-`. Mengembalikan `null` bila tidak ada digit sama sekali.
  - `PastedLine = { lineNumber, cells }`, dan `pastedLines(raw)` membuang baris kosong serta baris yang diawali `#`.
  - Dipakai hanya oleh `ProjectPaste` di `EntriesPanel.tsx`.
- `tasteskill.ts` -> lihat bagian 5.

### `src/hooks/`
- `useVerifiedSkills.ts` -> `useVerifiedSkills(repo?)` mengembalikan `{ state, refresh, refreshing, summarize }`.

### `src/content/` (registry teks yang dapat disunting)

Teks yang dapat disunting pemilik. Kunci registry dipakai apa adanya sebagai kunci baris di Supabase.

- `types.ts` -> `ContentPageId` (10 nilai: `global`, `home`, `career`, `projects`, `credentials`, `skills`, `about`, `contact`, `steadbyte`, `notfound`), `ContentEntry = { key, page, label, default, multiline?, hint? }`.
- `global.ts` -> `GLOBAL_CONTENT` (teks header dan footer, plus kunci `global.profile.avatar` berisi path berkas di Storage, bukan URL penuh).
- `home.ts` -> `HOME_CONTENT` (hero dan prinsip).
- Dua kunci menyimpan **daftar**, bukan kalimat: `footer.rollingStrip` (nilai bawaan sepuluh item yang tampil selama ini) dan `home.stack.marquee` (nilai bawaan kosong, artinya ikut riwayat pekerjaan). Keduanya `multiline: true`, satu item per baris, dan dibaca dengan `split("\n")`.
- `career.ts`, `projects.ts`, `credentials.ts`, `skills.ts`, `about.ts`, `contact.ts`, `steadbyte.ts`, `notfound.ts` -> satu berkas per halaman, masing-masing mengekspor `*_CONTENT` berisi judul, lead, label statistik, judul seksi, dan deskripsinya.
  - `steadbyte.ts` menambah halaman "About Steadbyte" (rute `/about-steadbyte`, nomor intro `08`) dengan 71 entri berpola `steadbyte.<seksi>.<field>` untuk empat seksi: `summary`, `problem`, `role`, `honest`. Karena `groupBySection()` di `ContentEditor` memakai segmen kedua kunci, pola ini otomatis membentuk kelompok yang rapi di panel.
  - Teks yang memuat angka hasil hitungan menyisakan token, misalnya `{count} skills, filtered by the kind of work`, supaya jumlahnya tidak ikut dibekukan saat pemilik menyunting kalimatnya.
- `registry.ts` -> `CONTENT_REGISTRY` (rakitan seluruh berkas halaman), `CONTENT_DEFAULTS` (`Record<string, string>`), `PAGE_META` (`{ id, title, route, description }[]`, dipakai sebagai tab pada `ContentEditor`), `entriesForPage(page)`, `findEntry(key)`. Di mode DEV ada pemeriksaan kunci duplikat.
- `ContentProvider.tsx` -> `ContentProvider`, `useContent()`, dan `useSiteText()`. `useContent()` mengembalikan `{ ready, overrides, drafts, previewing, setPreviewing, replaceDrafts, reload, text }`.
  - `overrides` = nilai terbit dari `portfolio_content`, `drafts` = nilai belum terbit dari `portfolio_drafts`. Keduanya diambil dengan `Promise.all`.
  - `useContent()` mengembalikan fungsi `text(key)` yang memilih `previewing ? drafts[key] ?? overrides[key] : overrides[key]`, lalu jatuh ke `CONTENT_DEFAULTS[key]`, lalu ke `key` itu sendiri. Artinya pengunjung biasa **tidak pernah** membaca `drafts`, sehingga nilai yang baru disimpan sebagai draf masih tampak lama di situs publik.
  - `useSiteText()` mengembalikan fungsi ringkas dengan perilaku yang sama, dipakai di `Home`, `Career`, `Projects`, `Credentials`, `Skills`, `About`, `Contact`, `Steadbyte`, `NotFound`, `SiteHeader`, dan `SiteFooter`. Nilai token diisi lewat argumen kedua, misalnya `t("skills.selfrating.title", { count: String(totalSkills) })`.
  - `previewing` disimpan di `sessionStorage` dengan kunci `arnal:content-preview`.
  - RLS menjawab daftar kosong untuk pengunjung biasa, jadi pengunjung selalu melihat nilai terbit.
  - Impor hook selalu dari `@/content/ContentProvider`. Tidak ada berkas `SiteTextProvider`.
  - Foto profil: `ContentEditor` punya blok khusus untuk `global.profile.avatar` (pratinjau, tombol unggah ke `portfolio-media/profile/`, dan kolom teks). `Home.tsx` memilih antara URL penuh dan `publicImageUrl(path)`, lalu menyembunyikan bingkainya sendiri bila berkas gagal dimuat. `publicImageUrl` mengembalikan `string | null`, jadi pemakaiannya sebagai `src` perlu `?? undefined`. Blok itu juga menampilkan penanda `role="status"` saat kunci masih berupa draf, karena unggahan langsung masuk bucket tetapi baru terlihat pengunjung setelah `Publish page` ditekan. Kode unggah berbasis IndexedDB lama (`PhotoSlot.tsx`, `photoStore.ts`, `photoValidation.ts`) sudah dihapus; satu-satunya jalur unggah sekarang ada di `ContentEditor`.

### `src/entries/` (entri portofolio dari basis data)

Karier, proyek, sertifikasi, keahlian, dan scan sertifikat dibaca dari sini, bukan dari
`src/data/portfolio.ts`. Berbeda dari `src/content/`, entri ditulis **langsung** ke tabelnya dan
tidak melewati alur draf lalu terbit.

- `types.ts` -> `EntryTable`, `ENTRY_TABLE`, `StoredEntry = { id, visible, sortOrder }`, `CertificationEntry` (extends `Certification` + `StoredEntry`, `credentialUrl: string`), `CertificationImage = { id, certificationId, storagePath, caption, width, height, byteSize, sortOrder }`, `ProjectImage = { id, projectId, storagePath, caption, mimeType, width, height, byteSize, sortOrder }`, `ProjectCurvePoint = { year, budgetM, impact }`, `EntrySnapshot` (memuat `certificationImages`, `projectImages`, `projectCurve`), parser batas `parseSnapshot()`, dan `publicImageUrl(storagePath)`.
  - `publicImageUrl` menyusun `${supabaseUrl}/storage/v1/object/public/portfolio-media/${storagePath}`.
- `EntriesProvider.tsx` -> `EntriesProvider`, `useEntries()`, dan dua tipe ringkas: `CertificationScan = { id, caption, url, storagePath }` serta `ProjectPhoto = { id, caption, url, storagePath }`.
  - `useEntries()` mengembalikan `{ all, career, projects, certifications, skills, scansFor(id), photosFor(id), curve, photoGroups, ready, offline, isSample(table), version, reload }`.
  - **Fallback per daftar**: `written.has(table) ? all[table].filter(r => r.visible) : SAMPLES[table]`. Jadi daftar yang belum pernah ditulis menampilkan entri contoh dari `SAMPLES`, sedangkan daftar yang sudah pernah ditulis memakai isi tabel apa adanya. `isSample(table)` dipakai panel admin untuk memberi tahu pemilik bahwa yang tampil masih contoh.
  - `written` dibaca dari tabel `portfolio_entity_usage`; `version` diambil dengan polling `portfolio_data_version` setiap `VERSION_POLL_MS = 60_000`.
  - `scansFor(id)` dan `photosFor(id)` membawa `storagePath` di samping `url`, karena menghapus berkas harus menghapus objek Storage-nya juga. `photoGroups` adalah daftar foto yang sudah dikelompokkan per proyek, untuk halaman publik.
  - `curve` adalah `ProjectCurvePoint[]` hasil `projectCurve` dari snapshot. **Kosong berarti grafik memakai rata-rata terhitung dari proyek yang tampil**, jadi pemakai `curve` wajib punya jalur cadangan.
  - Panggil `supabase` lewat `const client = supabase;` di dalam efek, bukan langsung, supaya tidak ada `null` di dalam closure.
- `useEntryWriter.ts` -> `useEntryWriter()` mengembalikan `{ busy, feedback, clearFeedback, saveCareer, saveProject, saveCertification, saveSkill, addSkillCategory, setVisible, removeEntry, reorderEntries, addImage, removeImage, reorderImages, addProjectPhoto, setProjectPhotoCaption, removeProjectPhoto, reorderProjectPhotos, saveProjectCurve }`.
  - `saveSkill` mengirim `level` (1-5) dan `since` (tahun). `addSkillCategory(name)` memanggil `portfolio_add_skill_category` dan mengembalikan `uuid` atau `null`.
  - Pola `call(rpc, args, done, failure)`: satu tulis, satu `await reload()`, satu baris umpan balik. `refuse(msg)` menandai `busy = false` dan `{ tone: "error" }`.
  - `addImage({ certificationId, storagePath, caption, width, height, byteSize })` memanggil `portfolio_add_certification_image`.
  - `removeImage(id, storagePath)` menghapus baris dulu, lalu objek Storage-nya; kegagalan pembersihan hanya `console.warn` karena berkas yatim tidak tampil di mana pun.
  - `MEDIA_BUCKET = "portfolio-media"`.

### `src/admin/` (panel admin)

- `AdminAuthProvider.tsx` -> `AdminAuthProvider` dan `useAdminAuth()`, mengembalikan `{ status, identity, signIn, signOut, sendPasswordReset, resetPasswordWithToken, changePassword }`.
  - `status` = `"loading" | "signed-out" | "signed-in"`; `identity` = `{ email, mustChangePassword } | null`.
  - `signIn(username, password)` memetakan nama pengguna ke surel lewat `src/lib/adminAccount.ts`.
  - `sendPasswordReset(emailOrUsername)` memetakan input lewat `resolveAdminEmail`, lalu memanggil `supabase.auth.resetPasswordForEmail(email, { redirectTo: ${origin}/admin/reset-password })`. Bila input tidak dikenali, ia tetap mengembalikan `ok: true` dengan pesan netral supaya tidak membocorkan daftar izin.
  - `resetPasswordWithToken(nextPassword)` memanggil `supabase.auth.updateUser({ password })`, lalu `rpc("portfolio_password_changed")` untuk membersihkan penanda wajib ganti sandi, dan menaikkan status menjadi `signed-in`.
  - `changePassword(current, next)` = `signInWithPassword(current)` -> `updateUser({ password: next })` -> `rpc("portfolio_password_changed")`.
  - Akun yang masuk tetapi tidak ada di daftar izin langsung dipaksa `signOut()`.
- `PasswordForm.tsx` -> `PasswordForm({ onDone, submitLabel })`. Prop `onDone` **wajib**.
- `useAdminData.ts` -> `useAdminEditor()` dan `useAdminHistory(version)`, plus tipe `DraftEntry`, `RevisionRow`, `ActivityRow`, `EditorFeedback`, `AdminEditorValue`, `AdminHistoryValue`, dan fungsi `plural(count, one, many)`.
  - `useAdminEditor()` mengembalikan `{ pendingKey, busy, feedback, version, clearFeedback, saveDrafts, discardDrafts, publishDrafts, revertRevision }`.
  - Setiap aksi diakhiri `await reload()` lalu menaikkan `version`, sehingga riwayat ikut menyegarkan.
  - `useAdminHistory(version)` membaca `portfolio_revisions` dan `portfolio_activity` masing masing 40 baris terbaru; kegagalan baca hanya `console.warn`, tidak melempar.
- `ContentEditor.tsx` -> editor per halaman. Baseline field = `drafts[key] ?? overrides[key] ?? CONTENT_DEFAULTS[key]`. Ketikan ditahan di state `local`; `dirtyKeys` bertahan saat berpindah halaman; setelah simpan berhasil, kunci dihapus dari `local`.
- `EntriesPanel.tsx` -> tab **Entries**: pengelolaan karier, proyek, sertifikasi, dan keahlian, plus unggah scan sertifikat dan foto proyek.
  - Konstanta modul: `FIELD`, `STATUS_OPTIONS`, `CERT_STATUS_OPTIONS`, `TABS`, `MEDIA_BUCKET = "portfolio-media"`, `MAX_UPLOAD_BYTES = 10 * 1024 * 1024`, `ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"]`, `ACCEPTED_LABEL`, `MAX_UPLOAD_LABEL`, `PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"]`, `PHOTO_LABEL`.
  - Helper: `readImageSize(file)` (lewat `URL.createObjectURL`, selalu `resolve` dan tidak pernah melempar; mengembalikan `{ width: 0, height: 0 }` bila gambar gagal dimuat), `safeExtension(name)`, `fallbackExtension(mimeType)`.
  - `useValueLists()` mengembalikan `{ lists, reload }`; mengambil `portfolio_project_kinds`, `portfolio_certification_domains`, `portfolio_skill_categories`, `portfolio_role_levels` dengan `FALLBACK_LISTS` bila gagal. `reload` dipanggil `SkillForm` lewat `onCategoryAdded` supaya kategori yang baru ditambah langsung muncul di dropdown.
  - `EntryList<T extends StoredEntry>({ table, rows, writer, isSample, sampleCount, addLabel, describe, renderForm, extraAction? })` adalah kerangka bersama untuk keempat daftar. `extraAction` dirender tepat setelah tombol tambah; hanya daftar proyek yang memakainya, yaitu untuk `ProjectPaste`.
  - Helper formulir: `FormGrid`, `FoldedFields`, `FormActions`, `TextField`, `TextAreaField`, `MonthField`, `MonthRangeField`, `NumberField`, `ScaleField`, `CategoryField`, `ListField`, `SelectField`, `VisibilityField`, `FieldLabel`, `FieldHint`, `PanelMessage`.
    - `ScaleField({ label, value, onChange, hint })` adalah pemilih 1-5 bergaya diagram batang (lima tombol dengan tinggi bertingkat, `aria-pressed`, label `n/5`). Dipakai untuk `level` skill.
    - `CategoryField({ label, value, onChange, options, onAdd, hint })` adalah dropdown kategori dengan tombol `Add a category` yang membuka kolom nama; `onAdd` memanggil `writer.addSkillCategory`. Nilai yang gagal ditambah ditampilkan lewat `PanelMessage`.
    - `PanelMessage({ children })` adalah catatan satu baris di bawah field untuk kegagalan yang ditangkap formulir sendiri.
    - `FoldedFields({ children })` menaruh anaknya di dalam satu sel selebar dua kolom yang dibuka dengan satu klik (`aria-expanded`). Dipakai `ProjectForm` untuk `Your role`, `Location`, `Months`, `Team size`, `Working stack`, dan `Featured`.
  - `ProjectPhotos({ writer, projectId })` menangani unggah banyak foto sekaligus, caption, urut ulang, dan hapus. Path objek = `projects/${projectId}/${crypto.randomUUID()}.${safeExtension(file.name) ?? fallbackExtension(file.type)}`. Hanya menerima `PHOTO_TYPES` (tanpa PDF). Tombol "Add photos" memakai `<input type="file" multiple className="sr-only" />`, dan `FieldHint` menjelaskan unggah beruntun.
  - `PhotoCaption({ caption, disabled, onSave })` menyimpan saat blur atau Enter, bukan per ketikan, dan di-`key` dengan `${photo.id}:${photo.caption}` oleh pemanggilnya supaya kotaknya tidak pernah menampilkan nilai yang tidak dipegang barisnya.
  - `ProjectCurveEditor({ writer })` adalah editor garis manual grafik: satu baris per tahun berisi `year`, `budgetM`, `impact`, dengan tombol `Add a year`, `Fill from projects` (agregasi dari `projects` yang tampil), `Save the line`, dan `Clear, back to computed`. Baris diurutkan per tahun sebelum dikirim ke `writer.saveProjectCurve`, dan state lokalnya diganti dengan urutan yang sama supaya penanda "ada perubahan" tidak menyala palsu.
  - `ProjectPaste({ writer, lists })` adalah dialog "Paste many": membaca tabel tempel dengan `parsePastedProjects(raw, lists)` yang memakai `pastedLines`/`pastedNumber` dari `@/lib/paste`, menampilkan `PASTE_COLUMNS` (name, kind, status, role, year, months, teamSize, budgetM, impact, location, summary, stack), pratinjau tiap baris yang terbaca, dan daftar `problems` bernomor baris untuk yang dilewati. Hanya `name` dan `year` yang wajib; angka kosong menjadi 0, status tak dikenal menjadi `active`, stack dipecah pada koma atau titik koma. Baris disimpan satu per satu lewat `writer.saveProject({ ...row, featured: false, visible: true })`.
  - `CertificateScans({ writer, certificationId })` menangani unggah, urut ulang, dan hapus scan. Path objek = `certificates/${certificationId}/${crypto.randomUUID()}.${safeExtension(file.name)}`.
  - Alur unggah: berkas diunggah lebih dulu, barisnya menyusul; bila baris ditolak, objek yang sudah terunggah dihapus kembali supaya tidak ada berkas yatim.
  - Blok scan hanya dirender bila `entry` ada, karena `portfolio_certification_images.certification_id` adalah kunci asing wajib.
  - Formulir wajib menghormati batas yang dijaga basis data. Lihat bagian 7 untuk daftar batasnya.
- `HistoryPanel.tsx` -> seksi `revisions` dengan tombol `Restore`, dan seksi `activity`.
- `MessagesPanel.tsx` -> tab **Inbox**: `export default MessagesPanel()` tanpa prop. `listMessages()` dipanggil sekali saat mount; `unread` dihitung dari `messages.filter(m => !m.read)` dan kartu yang belum dibaca diberi `border-l-2 border-l-primary`. `openMessage()` menandai baris sudah dibaca secara optimistis (menulis dulu, lalu memperbarui state lokal), sedangkan `toggleRead()` dan `remove()` menulis lalu memuat ulang daftar. Balasan memakai `mailto:` dengan subjek `Re: <topic>`. Seluruh jalur melewati RLS, jadi panel ini bergantung pada `GRANT` di level tabel (lihat bagian 7).

### `src/lib/` (selain entry/produk)

- `supabase.ts` -> `supabase` (klien atau `null` bila konfigurasi kosong), `isSupabaseConfigured`, `MISSING_CONFIG_MESSAGE`. Membaca `VITE_SUPABASE_URL` dan `VITE_SUPABASE_PUBLISHABLE_KEY`.
- `adminAccount.ts` -> `ADMIN_ACCOUNTS` (`{ arnalputra: "arnal@steadbyte.com" }`), `MIN_PASSWORD_LENGTH = 12`, `resolveUsername`, `resolveAdminEmail` (menerima nama pengguna atau surel, dipakai jalur lupa sandi), `checkNewPassword`, `PasswordProblem`, `PASSWORD_PROBLEM_TEXT`, `describeAuthError`.
- `messages.ts` -> `sendContactMessage()`, `listMessages()`, `markMessageRead()`, `deleteMessage()`, plus tipe `Message` (`{ id, name, email, topic, message, read, createdAt }`), `MessageRow` (bentuk snake_case dari Postgres), dan `SendResult` (`{ ok, emailed?, error? }`).
  - `sendContactMessage()` mem-`POST` ke `/api/contact` dan mengembalikan `{ ok: true, emailed }`; `emailed: false` berarti baris tersimpan tetapi surel notifikasi tidak terkirim, sehingga pengunjung tetap melihat status terkirim.
  - `listMessages()` membaca 7 kolom dari `portfolio_messages`, urut `created_at desc`, batas 200 baris, lalu memetakan snake_case ke camelCase. Ketiga fungsi panel bergantung pada `GRANT` tabel dan policy RLS.

## 4. Kelas komponen kustom (`src/index.css`)

Didefinisikan di `@layer components`. **Hanya ini yang ada** — jangan mengarang nama kelas lain.

| Kelas | Fungsi |
|---|---|
| `.eyebrow` | label kecil gaya mesin, dipakai hemat |
| `.hairline` | garis pemisah tipis |
| `.panel` | permukaan kartu dasar |
| `.panel-flagged` | panel dengan garis aksen kiri 3px `bg-primary/70` via `::before` |
| `.grid-lines` | latar kisi 56px dari `--border` |
| `.text-outline` | teks bergaris (`-webkit-text-stroke`), isi transparan |
| `.sheen` | kilau putih yang menyapu saat hover |
| `html.cursor-reticle` | menyembunyikan kursor bawaan saat reticle aktif, hanya di `min-width: 1024px`. Wajib `!important` karena CSS `@layer base` dipancarkan sebelum `@layer utilities`, dan urutan layer mengalahkan spesifisitas. `input`, `textarea`, dan `[contenteditable="true"]` dikecualikan dan tetap `cursor: text` |

Utility tambahan di `@layer utilities`: `.text-balance`, `.text-pretty`, `.no-scrollbar`.

Kelas berikut **tidak ada** dan pernah memicu bug: `.link-underline`.
Untuk tautan bergaris pakai inline: `underline decoration-primary/40 decoration-2 underline-offset-4 transition-colors hover:text-primary hover:decoration-primary`.

Token Tailwind kustom yang tersedia: palet `ink`, `rust`, `moss` (skala 50-950),
`borderRadius` `blob` dan `notch`, `boxShadow` `lift` dan `rust-glow`,
keyframes `marquee` `pulse-ring` `shimmer` `blob` `accordion`,
`transitionTimingFunction` `ease-out-expo` = `cubic-bezier(0.16, 1, 0.3, 1)`.

## 5. Integrasi registry keahlian (`src/lib/tasteskill.ts`)

**Koreksi fakta yang sering salah:** `tasteskill.dev` **bukan** penyedia API data keahlian.
Itu kumpulan berkas `SKILL.md` (framework anti-slop) untuk agen AI.
API publik yang nyata adalah `https://verified-skill.com/api/v1`.

Yang diekspor:
- `VerifiedSkill` = `{ slug, fullName, author, repoUrl, category, version, certTier, certScore, certMethod, certifiedAt, trustTier, trustScore, stars, forks, tainted, trend7d }`.
- `FetchState` = union `{ status: "idle" } | { status: "loading" } | { status: "ready"; skills; fetchedAt } | { status: "offline"; reason; fetchedAt }`.
- `fetchVerifiedSkills(repo?, signal?)`, `fetchVerifiedSkill(fullName, signal?)`.
- `competencyMap: Competency[]` — 4 area, tiap item `{ area, note, supportedBy[], relevance: "direct" | "supporting" }`.
- `summarize(skills)` -> `{ total, verifiedRatio, avgScore, avgTrust, tainted, topCategory }`.

Aturan mengikat: bila jaringan gagal, tampilkan status `offline` **apa adanya**.
Dilarang menampilkan angka verifikasi yang dikarang. Cache `localStorage` key `arnal:verified-skills:v1` dengan TTL 6 jam.

Semua teks yang terlihat pengguna berbahasa Inggris (satu bahasa, tanpa lapisan i18n).

## 6. Model data (`src/data/portfolio.ts`)

Berkas ini menyediakan **tipe** dan **entri contoh**. Entri contoh dipakai dua cara: sebagai
`SAMPLES` di `src/entries/EntriesProvider.tsx` untuk daftar yang belum pernah diisi pemilik, dan
sebagai data awal saat mengembangkan komponen tanpa menyentuh basis data.

Tipe di bawah ini juga menjadi dasar tipe baris tersimpan di `src/entries/types.ts`. Entri dari
basis data menambahkan `StoredEntry` (`id`, `visible`, `sortOrder`) dan memakai `id` berupa `uuid`,
bukan `p01`/`c01` seperti pada contoh.

- `ProjectStatus` = `"live" | "active" | "completed" | "on-hold"`.
- `ProjectKind` = `"Infrastructure" | "Internal Systems" | "Integration" | "Security" | "Data & Monitoring" | "ERP Rollout"`.
- `Role` = `{ id, title, company, sector, location, start, end, level: "IC" | "Lead" | "SPV" | "Manager", headcount, summary, highlights[], stack[] }`. `end: null` berarti masih berjalan. Tanggal format `yyyy-mm`.
- `Certification` = `{ id, name, issuer, domain, issued, expires, credentialId, status: "active" | "expired" | "renewing", cost }`. `cost` dalam juta rupiah.
- `Skill` = `{ id, name, category, level, years, since, evidence[] }`.
  `level` = penilaian diri **1 sampai 5** (5 paling kuat), bukan lagi 0-100. `since` = tahun skill mulai dikuasai; `years` = lama pemakaian.
  `category` = teks bebas. Nilai awalnya `"Leadership" | "Infrastructure" | "Engineering" | "Security" | "Data" | "Operations"`, tetapi pemilik dapat menambah kategori sendiri dari panel admin (tabel `portfolio_skill_category_options`).
  `evidence` berisi id yang merujuk ke `projects` / `certifications` / `career` (mis. `"p10"`). Relasi ini dipakai untuk label bukti di halaman Skills.
  **Catatan**: `evidence` hanya bermakna pada entri contoh. Entri dari basis data belum punya padanannya, jadi label bukti tidak dapat diandalkan untuk data asli.
- `profile` = `{ name, fullName, role, tagline, location, timezone, email, yearsExperience, teamLed, sitesManaged, availability, socials[] }`.
- `principles` = 4 item.

Id contoh yang dipakai konsisten: proyek `p01`+, sertifikat `c01`+, karier `r1`+, skill `s01`–`s30`.
Id entri dari basis data adalah `uuid` yang dibuat basis data, bukan pola itu.

## 7. Backend Supabase

Konfigurasi ada di `.env` (masuk daftar abaikan Git): `VITE_SUPABASE_URL` dan
`VITE_SUPABASE_PUBLISHABLE_KEY`. Kunci awam ini aman dipublikasikan; yang menjaga data adalah RLS.

Migrasi ada di `supabase/migrations/`:
- `20260915000000_portfolio_admin.sql`: tabel, RLS, dan seluruh fungsi.
- `20260915010000_portfolio_revision_capture.sql`: menggantikan `portfolio_publish` dan `portfolio_revert`.
- `20260915020000_portfolio_entities.sql`: tabel entri portofolio, gambar sertifikat, dan fungsi CRUD-nya.
- `20260915021000_portfolio_entry_usage.sql`: tabel penanda `portfolio_entity_usage` + trigger `after insert` pada keempat tabel entri.
- `20260916000000_portfolio_messages.sql`: tabel `portfolio_messages`, RLS, tiga policy admin, dan fungsi kirim versi awal.
- `20260916000100_portfolio_message_limits.sql`: menulis ulang `portfolio_send_message` dengan normalisasi surel dan kuota.
- `20260916000200_portfolio_message_grants.sql`: `grant select, update, delete` pada `portfolio_messages` untuk `authenticated`.
- `20260919000000_portfolio_allow_blank_values.sql`: mengizinkan nilai kosong pada kolom teks entri dan konten.
- `20260919010000_portfolio_certificate_files.sql`: lampiran PDF dan foto pada sertifikat, termasuk kolom `mime_type` dan perluasan allowlist MIME bucket.
- `20260919020000_portfolio_project_media.sql`: foto proyek (`portfolio_project_images`) dan garis grafik manual (`portfolio_project_curve`) beserta fungsinya. Dicatat sebagai tiga migrasi terpisah saat diterapkan.
- `20260919030000_portfolio_skill_options.sql`: kategori keahlian menjadi data (`portfolio_skill_category_options` + `portfolio_add_skill_category`), skala `level` dikonversi ke 1-5, dan `last_used` diganti `since`. **Bagian 5 berkas ini sempat tidak teraplikasi ke produksi** sehingga `portfolio_entries()` tetap menyebut `last_used` dan gagal `42703`; diperbaiki lewat migrasi `portfolio_fix_entries_since`.
- `portfolio_fix_entries_since`: perbaikan langsung di produksi (tidak ada berkas di `supabase/migrations/`), menulis ulang `portfolio_entries()` agar memakai `'since', s.since`.

### Endpoint kontak (`api/contact.ts`)

Vercel serverless function, **satu satunya berkas di `api/`**. Tidak memakai `@vercel/node`;
tipe `RequestLike` dan `ResponseLike` dideklarasikan lokal supaya endpoint tidak punya dependensi.

- Urutan yang dipegang: `405` (bukan `POST`) -> cek `SUPABASE_URL`/`SUPABASE_KEY` -> validasi `400`
  -> simpan `502` -> kirim surel `200`. Pesan **selalu** disimpan lebih dulu, surel bersifat
  best effort, sehingga kegagalan surel tetap menjawab `{ ok: true, emailed: false }`.
- Validasi: nama 2 sampai 100, surel 5 sampai 200 dengan pola, pesan 20 sampai 5000 karakter.
  `topic` kosong diganti `"General inquiry"`.
- `storeMessage()` memanggil RPC lewat `fetch` ke `${SUPABASE_URL}/rest/v1/rpc/portfolio_send_message`
  dengan header `apikey` dan `Authorization: Bearer`. Tidak ada penulisan langsung ke tabel.
- `sendEmail()` memanggil `https://api.resend.com/emails` dengan `from`, `to`, `reply_to`
  (surel pengunjung), `subject`, `html`, dan `text`. Template HTML-nya bertema Rust & Ink dan
  memakai tabel presentasional dengan gaya inline supaya selamat di Gmail dan Outlook.
- Variabel lingkungan **tanpa awalan `VITE_`**, karena awalan itu berarti "kirim ke peramban":
  `RESEND_API_KEY`, `CONTACT_FROM_EMAIL` (bawaan `Portfolio <onboarding@resend.dev>`), dan
  `CONTACT_TO_EMAIL`. Sisi Supabase membaca `VITE_SUPABASE_URL` dan `VITE_SUPABASE_PUBLISHABLE_KEY`.
- Fungsi ini tetap terpanggil meski `vercel.json` punya rewrite `/(.*)` -> `/index.html`, karena
  File System Routes dievaluasi sebelum Rewrites. Jangan menambahkan aturan `/api/(.*)` tanpa alasan.
- Di `npm run dev`, `/api/contact` menjawab 404. Itu normal: Vite tidak menyajikan serverless
  function Vercel.

Bucket Storage `portfolio-media`: publik, batas **10.485.760 byte** per berkas, MIME hanya
`image/jpeg`, `image/png`, `image/webp`, `application/pdf`. Empat policy `storage.objects`: baca publik, sedangkan
`INSERT`/`UPDATE`/`DELETE` hanya untuk `authenticated` yang lolos `portfolio_is_admin()`.
Klien mengunggah **langsung** ke Storage, jadi tanpa policy itu unggahan akan gagal meski
tabelnya benar.

### Tabel

| Tabel | Isi | RLS |
|---|---|---|
| `portfolio_admins` | Daftar izin: `email` (PK), `note`, `added_at`, `must_change_password` | Aktif, **tanpa policy** = tidak dapat diakses lewat API |
| `portfolio_content` | Nilai terbit: `key` (PK), `value`, `updated_at`, `updated_by` | Baca publik, tulis hanya lewat fungsi |
| `portfolio_drafts` | Nilai belum terbit, struktur sama | Hanya admin |
| `portfolio_revisions` | `id`, `key`, `value`, `action` (`publish`/`revert`), `actor`, `created_at` | Baca oleh admin, tulis hanya lewat fungsi |
| `portfolio_activity` | `id`, `actor`, `action`, `target`, `detail`, `created_at` | Baca oleh admin, tulis hanya lewat fungsi |
| `portfolio_career` | Entri riwayat pekerjaan | Baca publik untuk baris `visible`, tulis hanya lewat fungsi |
| `portfolio_projects` | Entri proyek | idem |
| `portfolio_certifications` | Entri sertifikasi | idem |
| `portfolio_skills` | Entri keahlian | idem |
| `portfolio_certification_images` | Scan sertifikat: `certification_id` (FK), `storage_path`, `caption`, `width`, `height`, `byte_size`, `sort_order` | Baca publik bila sertifikat induknya `visible` |
| `portfolio_project_images` | Foto/screenshot proyek: `project_id` (FK, cascade), `storage_path`, `mime_type` (3 nilai), `caption`, `width`, `height`, `byte_size`, `sort_order` | Baca publik bila proyek induknya `visible` |
| `portfolio_project_curve` | Garis grafik manual: `year` (PK), `budget_m`, `impact`. Tabel kosong berarti grafik memakai nilai terhitung | Baca publik. Tidak ada kolom `visible` |
| `portfolio_entity_usage` | Penanda `entity` (PK) + `first_write_at`. Menandai daftar yang sudah pernah ditulis | Baca publik |
| `portfolio_skill_category_options` | Kategori keahlian yang dapat ditambah pemilik: `id`, `name` (1-80, unik tanpa peduli huruf besar kecil), `sort_order`, `created_at`, `updated_by` | Baca publik. Tulis hanya lewat `portfolio_add_skill_category` |
| `portfolio_messages` | Pesan formulir kontak: `id`, `name`, `email`, `topic`, `message`, `read`, `created_at` | RLS aktif, **tanpa policy untuk publik** sehingga `anon` tidak dapat membacanya. `select`/`update`/`delete` hanya untuk `authenticated` yang lolos `portfolio_is_admin()`, dan tetap butuh `GRANT` di level tabel |

Batas kolom yang **wajib** dihormati formulir, karena basis data menolak nilai di luarnya:
- `portfolio_career`: `title`/`company` 1-160, `start_month`/`end_month` pola `yyyy-mm`, `level` salah satu dari `IC`/`Lead`/`SPV`/`Manager`, `headcount` 0-500, `summary` maksimal 2000.
- `portfolio_projects`: `name` 1-200, `status` salah satu dari `live`/`active`/`completed`/`on-hold`, `year` 1980-2100, `months` 0-600, `team_size` 0-500, `budget_m` >= 0, `impact` 0-100, `summary` maksimal 4000.
- `portfolio_certifications`: `name` 1-200, `issuer` 1-160, `credential_url` harus diawali `https://`, `status` salah satu dari `active`/`expired`/`renewing`, `cost_m` >= 0.
- `portfolio_skills`: `name` 1-160, `level` **1-5**, `years` 0-60, `since` 1980-2100.
- `portfolio_certification_images`: `storage_path` 1-400, `caption` maksimal 300, `width`/`height`/`byte_size` harus > 0 bila diisi.
- `portfolio_project_images`: `storage_path` 1-400, `mime_type` salah satu dari `image/jpeg`/`image/png`/`image/webp` (**tanpa PDF**, berbeda dari bucket), `caption` maksimal 300, `width`/`height`/`byte_size` harus > 0 bila diisi.
- `portfolio_project_curve`: `year` 1980-2100 dan menjadi kunci, `budget_m` >= 0, `impact` 0-100. Satu baris per tahun.
- Semantik penting: `expires_month = null` berarti **tidak pernah kedaluwarsa**, bukan "belum diisi".

### Fungsi

| Fungsi | Argumen | Mengembalikan |
|---|---|---|
| `portfolio_is_admin()` | - | `boolean` |
| `portfolio_admin_state()` | - | `table(email text, must_change_password boolean)` |
| `portfolio_password_changed()` | - | `void` |
| `portfolio_validate_value(p_key, p_value)` | dua teks | teks, atau melempar galat |
| `portfolio_save_draft(p_key, p_value)` | dua teks | `void` |
| `portfolio_discard_draft(p_key)` | teks, `null` = semua | `integer` jumlah baris terhapus |
| `portfolio_publish(p_keys)` | `text[]`, `null` = semua | `integer` jumlah kunci diterbitkan |
| `portfolio_revert(p_revision_id)` | `bigint` | `text` kunci yang dipulihkan |
| `portfolio_log(p_action, p_target, p_detail)` | tiga teks | `void` |
| `portfolio_log_media()` | - | `trigger` |
| `portfolio_entries()` | - | `jsonb` berisi `version`, `career`, `projects`, `certifications`, `certificationImages`, `projectImages`, `projectCurve`, `skills` |
| `portfolio_save_career(p_payload)` | `jsonb` | `uuid` |
| `portfolio_save_project(p_payload)` | `jsonb` | `uuid` |
| `portfolio_save_certification(p_payload)` | `jsonb` | `uuid` |
| `portfolio_save_skill(p_payload)` | `jsonb` | `uuid` |
| `portfolio_set_entry_visible(p_table, p_id, p_visible)` | teks, `uuid`, `boolean` | `void` |
| `portfolio_delete_entry(p_table, p_id)` | teks, `uuid` | `void` |
| `portfolio_reorder_entries(p_table, p_ids)` | teks, `uuid[]` | `void`, menulis `sort_order = ordinality * 10` |
| `portfolio_add_certification_image(p_payload)` | `jsonb` | `uuid` |
| `portfolio_delete_certification_image(p_id)` | `uuid` | `text` = `storage_path`, supaya klien dapat menghapus objeknya |
| `portfolio_reorder_certification_images(p_certification_id, p_ids)` | `uuid`, `uuid[]` | `void` |
| `portfolio_add_project_image(p_payload)` | `jsonb` | `uuid` baris baru. `mime_type` diambil dari payload atau disimpulkan dari ekstensi, `sort_order` mulai dari `max + 10` |
| `portfolio_delete_project_image(p_id)` | `uuid` | `text` = `storage_path`, supaya klien dapat menghapus objeknya |
| `portfolio_reorder_project_images(p_project_id, p_ids)` | `uuid`, `uuid[]` | `void`. Menulis `sort_order = ordinality * 10`, dibatasi `project_id` |
| `portfolio_set_project_image_caption(p_id, p_caption)` | `uuid`, `text` | `void`. Melempar bila barisnya tidak ada |
| `portfolio_save_project_curve(p_points)` | `jsonb` | `void`. Upsert satu baris per tahun lalu menghapus tahun yang tidak lagi dikirim, jadi array kosong berarti mengosongkan kurva. Batas 60 tahun |
| `portfolio_project_kinds()` | - | `text[]` |
| `portfolio_certification_domains()` | - | `text[]` |
| `portfolio_skill_categories()` | - | `text[]`. **`stable`**, membaca tabel `portfolio_skill_category_options` urut `sort_order` |
| `portfolio_add_skill_category(p_name)` | `text` | `uuid` baris baru. Hanya admin. Menolak nama kosong, lebih dari 80 karakter, atau duplikat tanpa peduli huruf besar kecil |
| `portfolio_role_levels()` | - | `text[]` |
| `portfolio_send_message(p_name, p_email, p_topic, p_message)` | empat teks | `uuid` baris baru. **Satu satunya fungsi tulis yang terbuka untuk `anon`**, karena formulir publik memakainya. Menormalkan surel dengan `lower(trim())`, menolak surel tidak valid dengan `P0001`, memotong `topic` ke 120 karakter, dan menegakkan kuota 5 pesan per jam per surel serta 60 pesan per jam secara keseluruhan |

Fungsi tulis `security definer` dengan `set search_path = public, pg_temp`, memeriksa
`portfolio_is_admin()`, dan melempar `42501` bila pemanggil bukan admin. Hak eksekusinya
**hanya** `authenticated`. Fungsi daftar nilai terbuka untuk
`anon, authenticated`, sehingga panel dapat mengisinya tanpa berada dalam sesi admin. Tiga di
antaranya (`portfolio_project_kinds`, `portfolio_certification_domains`, `portfolio_role_levels`)
masih `immutable` dan dipaku di dalam fungsi; `portfolio_skill_categories` sudah `stable` karena
daftarnya kini berasal dari tabel yang dapat ditambah pemilik.
Pengecualian berikutnya adalah `portfolio_send_message`: ia memang harus terbuka untuk `anon`,
dan sebagai ganti pemeriksaan admin ia menegakkan validasi serta kuota. Membukanya untuk `anon`
tidak membuka tabel, karena fungsinya berjalan sebagai pemilik dan `anon` tetap tanpa `GRANT`
apa pun pada `portfolio_messages`.

`portfolio_publish` **selalu** menulis satu baris revisi, dengan nilai `null` bila kunci itu belum
pernah diterbitkan. `portfolio_revert` memperlakukan nilai `null` sebagai perintah menghapus
override, sehingga kunci kembali ke teks bawaan di bundel.

`portfolio_save_*` menentukan mode lewat `portfolio_clean_text(p_payload ->> 'id') is null`:
`id: null` berarti **insert**, `id` terisi berarti **update**.

`portfolio_entity_usage` diisi oleh trigger `after insert ... for each statement` pada keempat
tabel entri, bukan oleh fungsi `portfolio_save_*`. Trigger tahu tabel tempat ia menyala, sehingga
fungsi simpan tidak perlu diubah untuk menyebut namanya sendiri.

### Memakai MCP Supabase

Nama server adalah `mcp_supabase_arnal`. `apply_migration` menerima `{ name, query }`;
`execute_sql` menerima `{ query }`.

Verifikasi yang berguna, dan lebih kuat daripada membaca berkas migrasi: periksa langsung dengan
`execute_sql`, misalnya `select tgname, tgrelid::regclass, tgtype from pg_trigger where tgname like 'portfolio_%_used'`,
`select * from pg_policies where schemaname = 'storage' and tablename = 'objects'`, atau
`select id, public, file_size_limit, allowed_mime_types from storage.buckets`.

Untuk menguji jalur tulis admin tanpa mengotori data, jalankan di dalam transaksi yang
di-`rollback`, dengan peran dan klaim yang disetel lebih dulu:
`set local role authenticated;` lalu
`select set_config('request.jwt.claims', '{"email":"arnal@steadbyte.com","role":"authenticated"}', true);`.
Ingat: `portfolio_entity_usage` **tidak pernah dibersihkan**, jadi uji tulis di luar transaksi
akan permanen membuat daftar itu berhenti menampilkan entri contoh.

## 8. Lapisan data `src/data/`

**Sudah bukan lagi satu-satunya sumber data.** Sejak entri portofolio pindah ke Supabase, berkas ini
hanya menyediakan tipe, entri contoh, dan data yang memang belum dapat disunting pemilik.

| Berkas | Ekspor |
|---|---|
| `portfolio.ts` | `profile`, `roles`, `projects`, `certifications`, `skills`, `principles` |
| `types.ts` | `Role`, `Project`, `Certification`, `Skill`, dan tipe pendukung lainnya |

Aturan pembagiannya:

- Teks yang pemilik harus dapat ubah tanpa menyentuh kode -> `src/content/`, dibaca lewat `useSiteText()`.
- Data terstruktur yang pemilik kelola sendiri -> tabel Supabase, dibaca lewat `useEntries()` dari `src/entries/`.
- Data yang belum punya pengelola -> tetap di `src/data/portfolio.ts`.

Yang **masih** diimpor statis dari `@/data/portfolio` dan belum dapat disunting pemilik:

| Berkas | Yang diimpor |
|---|---|
| `SiteHeader.tsx`, `SiteFooter.tsx` | `profile` |
| `Home.tsx`, `About.tsx` | `profile`, `principles` |
| `Contact.tsx` | `profile` |

Yang **sudah** memakai `useEntries()` dan tidak boleh dikembalikan ke impor statis:
`Home`, `Career`, `Projects`, `Credentials`, `Skills`, `About`, `NotFound`, `CareerCharts`,
`ProjectCharts`, `SkillCharts`, `CareerTable`, `ProjectTable`, `CertificationTable`,
`EntriesPanel`, dan `CertificateSlideshow`. Beberapa di antaranya masih mengimpor **tipe** saja
(`import type { Project } from "@/data/portfolio"`), dan itu benar.

Konsekuensinya: perhitungan turunan yang dulu dilakukan di tingkat modul **wajib** dipindahkan ke
dalam body komponen, karena datanya baru ada saat render. Ini pernah menjadi sumber galat.
Beri guard pada setiap pembagian dan pencarian nilai ekstrem:
`count > 0 ? Math.round(total / count) : 0`, `Math.max(0, ...arr)`, dan `arr[0] ?? null`.

## 9. Alur kerja yang disarankan untuk tugas baru

1. Baca skill ini + `docs/PRD.md`. Jangan menjelajah repo dari nol.
2. Bila tugas menyentuh komponen UI, buka **hanya** berkas komponen yang relevan untuk memastikan nama prop.
3. Tentukan dulu datanya milik lapisan mana, karena salah pilih lapisan berarti salah arsitektur:
   entri yang dikelola pemilik -> `src/entries/`; teks yang disunting pemilik -> `src/content/`;
   sisanya -> `src/data/portfolio.ts`.
4. Bila tugas menambah field pada entri, ubah migrasi + `src/entries/types.ts` + `EntriesPanel.tsx` + pembacanya, lalu terapkan migrasinya lewat MCP. Jangan lupa `notify pgrst, 'reload schema';`.
5. Bila tugas menambah teks yang dapat disunting, tambahkan entri di `src/content/`, lalu baca lewat `useSiteText()`. Basis data tidak perlu diubah.
6. Bila menambah kelas CSS, pastikan dulu kelas itu belum ada di `src/index.css` bagian 4 di atas.
7. Bila tugas menambah **halaman publik baru**, sentuh tujuh titik ini berurutan: (a) `src/content/<page>.ts` baru, (b) anggota baru pada union `ContentPageId` di `src/content/types.ts`, (c) impor + spread + entri `PAGE_META` di `src/content/registry.ts`, (d) kunci `nav.<page>` di `src/content/global.ts`, (e) berkas halaman di `src/pages/`, (f) `<Route>` di `src/App.tsx`, (g) entri `navItems` di `src/components/layout/SiteHeader.tsx` (footer ikut otomatis). Tambahkan juga rute ke `ROUTES` di `NotFound.tsx` beserta pasangan `notfound.route.N.label`/`.hint`. Nomor pada `navItems` dan `*.intro.index` harus ikut disesuaikan.
8. Setelah selesai: jalankan skill `verify-before-done`, lalu catat perubahan di `docs/PRD.md` lewat skill `prd-guardian`.

## 10. Jebakan yang sudah pernah terjadi

- Import ikon lucide yang tidak dipakai -> error build karena `noUnusedLocals`.
- `Badge` / `BadgeProps` terhapus dari `Credentials.tsx` padahal masih dipakai `StatusBadge` -> TS2304.
- Memakai `@react-three/drei` padahal tidak terpasang -> TS2307. Tulis sendiri dengan `@react-three/fiber` + `three`.
- `recharts` di sini v2, jadi prop dan import gaya v3 akan gagal.
- Em-dash pada teks yang terlihat pengguna melanggar aturan desain proyek (lihat skill `anti-slop-design`).
- `DELETE` tanpa klausa `WHERE` ditolak `21000` di dalam fungsi. Role `authenticator` yang dipakai PostgREST memuat `session_preload_libraries` berisi `supautils, safeupdate`. Selalu tambahkan syarat yang selalu benar, misalnya `where key is not null`.
- `insert ... select ... from tabel where key = ...` menulis nol baris bila kunci itu belum ada. Bila baris harus selalu tercatat, jangan mengandalkan `select`; bungkus dalam subquery skalar, seperti pada `portfolio_publish`.
- Nama tool MCP yang benar `mcp_supabase_arnal`. Salah nama server akan tampak seperti kegagalan koneksi.
- Di PowerShell, `"Bearer $obj.prop"` **tidak** meng-expand properti, hanya variabelnya. Simpan dulu ke variabel: `$token = $obj.prop`.
- **SearchReplace yang menyertakan blok di bawah area yang disunting akan ikut menghapusnya.** Jaga `old_str` sekecil mungkin, lalu verifikasi hasilnya dengan `Grep` atau `Read`. Ini sudah dua kali terjadi: blok `FormActions` di `CertificationForm` hilang, dan judul `### src/admin/` ikut terhapus saat menyisipkan bagian `src/entries/`.
- **Alamat surel hanya boleh dibaca lewat `t("global.profile.email")`, tidak lewat `profile.email` atau `profile.socials[2].href`.** Nilai di `src/data/portfolio.ts` bersifat beku dan tidak pernah berubah saat pemilik menyunting panel. Bila sebuah tautan berskema `mailto:`, bangun dengan `mailtoHref(t("global.profile.email"))`. Ini pernah membuat tautan footer dan header tetap menunjuk alamat lama meski teksnya sudah berubah.
- **`SearchReplace` bisa dilaporkan sukses padahal tidak tertulis.** Pernah muncul sebagai `'staleFrom' is declared but its value is never read` yang menetap setelah edit. Ulangi dengan konteks beberapa baris penuh, lalu pastikan lewat `Grep`. Kasus berikutnya: penambahan `mailtoHref` ke baris import `@/lib/utils` di `About.tsx` dan `Home.tsx` dilaporkan sukses dua kali, tetapi baru tertulis setelah percobaan ketiga. Selalu jalankan `npx tsc --noEmit` setelah menyunting baris import. Kasus terbaru: baris `import { STEADBYTE_CONTENT } from "./steadbyte";` di `src/content/registry.ts` dilaporkan sukses dan terlihat di diff, tetapi baru tertulis setelah percobaan kedua. Jadi pola yang paling sering gagal adalah **baris import**: verifikasi dengan `Read` pada rentang baris import, bukan hanya `Grep` nama simbolnya.
- **Perhitungan di tingkat modul pecah setelah data pindah ke hook.** Setiap pembagian wajib dijaga (`count > 0 ? ... : 0`), setiap `Math.max(...arr)` diberi seed, dan setiap `arr[0]` diberi `?? null`. Halaman yang sempat rusak: `Home.tsx`, `Projects.tsx`, `ProjectCharts.tsx`.
- **`supabase` bisa `null` di dalam closure efek.** Simpan dulu: `const client = supabase;` baru pakai `client` di dalam efek.
- **Tabel kosong tidak bisa dibedakan dari tabel yang sengaja dikosongkan** tanpa `portfolio_entity_usage`. Jangan menghapus penanda itu, dan jangan mengisi tabel entri di luar transaksi saat menguji.
- **`expires_month = null` pada sertifikat berarti "tidak pernah kedaluwarsa"**, bukan "belum diisi". Formulir yang memperlakukannya sebagai "kosong" akan salah menampilkan status.
- **RLS policy tanpa `GRANT` di level tabel tidak berguna.** Policy menentukan baris mana yang boleh disentuh, sedangkan `GRANT` menentukan apakah peran boleh menyentuh tabel itu sama sekali. Tanpa grant, `authenticated` ditolak sebelum policy pernah dievaluasi, dan gejalanya adalah panel yang selalu gagal membaca. Inilah yang pernah terjadi pada `portfolio_messages`. Bila ada tabel baru, berikan grant yang sesuai dan periksa dengan `has_table_privilege('authenticated', '<tabel>', 'select')`.
- **`/api/contact` menjawab 404 di `npm run dev`.** Itu normal, karena Vite tidak menjalankan serverless function Vercel. Fungsi itu hanya hidup setelah dideploy atau lewat `vercel dev`.
- Fungsi di `api/` tetap terpanggil meski `vercel.json` memuat rewrite SPA `/(.*)` -> `/index.html`, karena File System Routes dievaluasi sebelum Rewrites. Tidak perlu menambah aturan `/api/(.*)`.
- **`portfolio_certification_images` mengikuti visibilitas sertifikat induknya** lewat policy RLS. Scan yang "hilang" dari halaman publik biasanya karena sertifikatnya disembunyikan, bukan karena unggahannya gagal.
- **Tool `integrated_web-dev` -> `supabase_apply_migration` gagal** dengan "Supabase project id not found". Pakai `mcp_supabase_arnal` -> `apply_migration`.
- **Subagent tidak dapat memakai tool MCP.** Bila verifikasi perlu MCP, jalankan sendiri; subagent hanya bisa memakai PostgREST dengan kunci publik, yang bersifat baca saja.
- Sisa bahasa Indonesia di komponen UI sudah bersih; `src/components/ui/dialog.tsx` memakai `Close`. Bila menambah komponen baru, jaga aturan satu bahasa ini.
- **Deploy statis butuh dua variabel lingkungan, bukan satu.** Vercel tidak pernah melihat `.env` karena berkas itu diabaikan Git. Tanpa `VITE_SUPABASE_URL` dan `VITE_SUPABASE_PUBLISHABLE_KEY` di pengaturan proyek Vercel, hasil build berjalan dalam mode luring dan halaman publik menampilkan entri contoh selamanya. Domain hasil deploy juga perlu didaftarkan di Supabase -> Authentication -> URL Configuration.
- **Sebagian peringatan `get_advisors` tipe `security` bukan cacat di proyek ini.** `portfolio_entries()` dan `portfolio_is_admin()` memang `security definer` dan memang boleh dipanggil `anon`: yang pertama hanya mengembalikan baris bertanda `visible`, yang kedua hanya mengembalikan benar atau salah tanpa menulis. `rls_auto_enable()` berasal dari bawaan Supabase. `portfolio_admins` ber-RLS tanpa policy memang disengaja, karena hanya boleh dibaca lewat fungsi. Jangan "memperbaiki" keempat hal itu tanpa alasan baru.
- **Migrasi yang menulis ulang sebuah fungsi di bagian akhir berkas bisa teraplikasi sebagian.** `20260919030000_portfolio_skill_options.sql` sempat teraplikasi sampai bagian 1-4 saja, sehingga `portfolio_entries()` tetap menyebut kolom `last_used` yang sudah dihapus dan setiap pemanggilan gagal `42703`. Karena berkas migrasi di repo **tidak** mencerminkan keadaan basis data, jangan menyimpulkan bahwa sebuah perubahan sudah terpasang hanya karena tertulis di repo. Periksa dengan `select pg_get_functiondef('public.<fungsi>'::regproc);` atau `select position('<nama_kolom_lama>' in pg_get_functiondef('public.<fungsi>'::regproc));`.
- **Kegagalan `portfolio_entries()` tidak muncul sebagai galat yang ramai.** `EntriesProvider` menganggap galat RPC sebagai mode luring, lalu menyetel `all` ke `EMPTY`. Daftar yang sudah punya penanda di `portfolio_entity_usage` karena itu tampil **kosong**, bukan menampilkan entri contoh, dan panel Entries admin ikut kosong. Bila sebuah halaman entri kosong sementara halaman lain menampilkan contoh, periksa RPC-nya lebih dulu, bukan komponennya.
- **Satu galat di tengah transaksi probe membatalkannya secara implisit.** Seluruh pernyataan sesudahnya tampak "tidak berjalan", padahal transaksinya sudah mati sejak galat pertama. Jadi kueri probe tidak boleh memuat pernyataan yang pasti gagal, misalnya `select count(*) from public.portfolio_messages` sebagai peran `anon`. Susun probe agar semua pernyataannya sah, lalu nilai hasilnya.
- **`supabase.rpc(...)` dan `supabase.from(...)` tidak mengirim permintaan bila tidak di-`await`.** `PostgrestBuilder` di `@supabase/postgrest-js` 2.116.0 menjalankan `fetch` di dalam `then()`, jadi `void supabase.rpc(...)` membuat builder lalu membuangnya tanpa pernah mengirim apa pun. Tidak ada galat, tidak ada permintaan di log, dan kode tampak berjalan. Pernah terjadi pada tiga panggilan `portfolio_register_session` dan `portfolio_touch_session` di `AdminAuthProvider.tsx`, yang membuat `portfolio_admin_sessions` selalu kosong, `portfolio_touch_session` selalu `false`, dan panel menendang sesi yang baru saja masuk. Bila hasilnya tidak dibutuhkan, tetap bungkus dalam `async` yang meng-`await` lalu panggil dengan `void asyncFn()`, misalnya `pingSession()` di berkas itu.
- **`portfolio_touch_session` mengembalikan `false` untuk dua hal berbeda**: baris sesinya sudah dicabut, dan baris sesinya tidak ada. Karena `portfolio_register_session` memakai `on conflict ... do update` yang tidak pernah menghapus `is_revoked`, mendaftarkan ulang selalu aman. Jadi perlakukan `false` pertama sebagai "mungkin belum terdaftar" (daftarkan ulang lalu periksa sekali lagi), bukan langsung sebagai pencabutan.
- **Nilai yang masuk ke kolom entri harus lolos CHECK constraint tabel, bukan hanya bentuk muatan JS.** Bentuk muatan yang dikirim `useEntryWriter` adalah bentuk yang dibaca halaman, dan beberapa nama field berbeda dari kolom: `startMonth`/`endMonth` (karier dan sertifikat), `costM` (sertifikat), dan `kind`/`status` harus salah satu nilai dari `portfolio_project_kinds()` dan daftar status yang diizinkan (`live`, `active`, `completed`, `on-hold`). Nilai di luar daftar ditolak. Periksa dengan `select pg_get_constraintdef(oid) from pg_constraint where conrelid = 'public.portfolio_projects'::regclass and contype = 'c';` sebelum menulis probe.
