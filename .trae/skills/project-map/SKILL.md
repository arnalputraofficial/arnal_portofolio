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
| @react-three/drei | **tidak terpasang** | jangan pernah `import` dari paket ini |

Skrip:
- `npm run dev` -> vite, port 5173
- `npm run build` -> `tsc -b && vite build`
- `npm run preview` -> vite preview

## 2. Konfigurasi TypeScript (penting, mudah bikin error)

Hanya ada **satu** `tsconfig.json`. Tidak ada `tsconfig.app.json` maupun `tsconfig.node.json`.
Membuat `tsconfig.app.json` akan melanggar `tsc -b` (error TS5058).

Flag ketat yang aktif: `strict`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`.

Konsekuensi praktis:
- Setiap `import` yang tidak terpakai adalah **error build**, bukan sekadar warning.
- Setiap parameter fungsi yang tidak dipakai juga error. Hapus atau awali `_`.
- Alias path: `@/*` -> `./src/*` (hanya `baseUrl: "."`, tanpa `rootDir`).

## 3. Struktur file dan export

### `src/main.tsx`
Entry React. Merender `<App />` ke `#root`.

### `src/App.tsx`
- Export default `App`.
- `TooltipProvider` -> `SiteHeader` -> `AnimatePresence mode="wait" initial={false}` -> `PageShell` -> `Routes` -> `SiteFooter`.
- `PageShell` lokal: `motion.main` opacity 0/y 12 -> 1/0, exit y -8, `duration 0.38`, `ease [0.16, 1, 0.3, 1]`, `className="relative z-10"`.
- Rute: `/` Home, `/career` Career, `/projects` Projects, `/credentials` Credentials, `/skills` Skills, `/about` About, `/contact` Contact, `*` NotFound. Semua rute memakai kata Inggris.
- Tiap halaman di-import statis (bukan lazy).

### Halaman `src/pages/` (8 berkas, semua `export default`)

| Berkas | Rute | Isi pokok |
|---|---|---|
| `Home.tsx` | `/` | Hero + `HeroScene` 3D + ringkasan + sorotan |
| `Career.tsx` | `/career` | Timeline karier + `CareerCharts` + `CareerTable` |
| `Projects.tsx` | `/projects` | Sorotan proyek + `ProjectCharts` + `ProjectTable` |
| `Credentials.tsx` | `/credentials` | Masa berlaku sertifikat + recharts langsung + `CertificationTable` |
| `Skills.tsx` | `/skills` | Radar/bar skill + penilaian mandiri + `RegistryPanel` (verified-skill) |
| `About.tsx` | `/about` | Cara kerja, prinsip, kesalahan beserta biaya, FAQ |
| `Contact.tsx` | `/contact` | Formulir tervalidasi, salin pesan, `mailto:` |
| `NotFound.tsx` | `*` | 7 rute nyata + saran proyek dampak tertinggi |

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
- `SkillCharts.tsx` -> `SkillBalanceRadar({ data })`, `TopSkillsBar({ data, limit = 10 })`, `StackUsageChart()`, `ExperienceSpreadChart()`.
  Hanya `SkillCharts` dan `ChartFrame` yang menerima prop; sisanya mengambil data dari `@/data/portfolio` langsung.

**`fx/` (animasi dan efek)**
- `Reveal.tsx` -> `Reveal({ children, className, delay = 0, y = 18, as = "div" })` dengan `as` hanya boleh `"div" | "section" | "li" | "article"`.
  `RevealGroup({ children, className, stagger = 0.07 })`, `RevealItem({ children, className, y = 16 })`, `SplitHeading({ text, className, delay = 0 })`.
- `Counter.tsx` -> `Counter({ value, duration = 1.4, decimals = 0, prefix = "", suffix = "", className })`.
- `SpotlightCard.tsx` -> `SpotlightCard({ className, children, spotlightColor = "rgba(213, 81, 40, 0.16)", ...divProps })`.
- `Marquee.tsx` -> `Marquee({ items, className?, reverse = false, speed = 38 })`.
- `MagneticButton.tsx` -> `MagneticButton({ children, className, strength = 8, ...buttonProps })`. **Belum dipakai di halaman mana pun.**
- `CursorAura.tsx`, `ScrollProgress.tsx`, `ThemeToggle.tsx`.

**`three/`**
- `HeroScene.tsx` -> `HeroScene({ className })`. Canvas dengan rotasi otomatis + drag pointer. Dipakai hanya di `Home.tsx`.

**`tables/`**
- `DataTable.tsx` generik (TanStack Table v8) + `CareerTable.tsx`, `CertificationTable.tsx`, `ProjectTable.tsx`.
- `src/types/tanstack-table.d.ts` berisi augmentasi tipe untuk tabel.

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
- `utils.ts` -> `cn(...inputs)`, `nf(value, digits = 0)` (format angka `en-US`), `monthRange(start, end)` (menghasilkan `"Mar 2021 to Now"`), `monthsBetween(start, end)`, `humanDuration(months)`.
- `tasteskill.ts` -> lihat bagian 5.

### `src/hooks/`
- `useVerifiedSkills.ts` -> `useVerifiedSkills(repo?)` mengembalikan `{ state, refresh, refreshing, summarize }`.

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

Ini satu satunya sumber data. **Semua data adalah contoh** dan harus bisa ditukar tanpa menyentuh komponen.

- `ProjectStatus` = `"live" | "active" | "completed" | "on-hold"`.
- `ProjectKind` = `"Infrastructure" | "Internal Systems" | "Integration" | "Security" | "Data & Monitoring" | "ERP Rollout"`.
- `Role` = `{ id, title, company, sector, location, start, end, level: "IC" | "Lead" | "SPV" | "Manager", headcount, summary, highlights[], stack[] }`. `end: null` berarti masih berjalan. Tanggal format `yyyy-mm`.
- `Certification` = `{ id, name, issuer, domain, issued, expires, credentialId, status: "active" | "expired" | "renewing", cost }`. `cost` dalam juta rupiah.
- `Skill` = `{ id, name, category, level, years, lastUsed, evidence[] }`.
  `category` = `"Leadership" | "Infrastructure" | "Engineering" | "Security" | "Data" | "Operations"`.
  `evidence` berisi id yang merujuk ke `projects` / `certifications` / `career` (mis. `"p10"`). Relasi ini dipakai untuk label bukti di halaman Skills.
- `profile` = `{ name, fullName, role, tagline, location, timezone, email, yearsExperience, teamLed, sitesManaged, availability, socials[] }`.
- `principles` = 4 item.

Id yang dipakai konsisten: proyek `p01`+, sertifikat `c01`+, karier `r1`+, skill `s01`–`s30`.

## 7. Alur kerja yang disarankan untuk tugas baru

1. Baca skill ini + `docs/PRD.md`. Jangan menjelajah repo dari nol.
2. Bila tugas menyentuh komponen UI, buka **hanya** berkas komponen yang relevan untuk memastikan nama prop.
3. Bila tugas menambah field data, ubah `src/data/portfolio.ts` dulu (interface + data), baru komponen.
4. Bila menambah kelas CSS, pastikan dulu kelas itu belum ada di `src/index.css` bagian 4 di atas.
5. Setelah selesai: jalankan skill `verify-before-done`, lalu catat perubahan di `docs/PRD.md` lewat skill `prd-guardian`.

## 8. Jebakan yang sudah pernah terjadi

- Import ikon lucide yang tidak dipakai -> error build karena `noUnusedLocals`.
- `Badge` / `BadgeProps` terhapus dari `Credentials.tsx` padahal masih dipakai `StatusBadge` -> TS2304.
- Memakai `@react-three/drei` padahal tidak terpasang -> TS2307. Tulis sendiri dengan `@react-three/fiber` + `three`.
- `recharts` di sini v2, jadi prop dan import gaya v3 akan gagal.
- Em-dash pada teks yang terlihat pengguna melanggar aturan desain proyek (lihat skill `anti-slop-design`).
