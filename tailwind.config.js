/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: { "2xl": "1320px" },
    },
    extend: {
      colors: {
        /* ---- Palet kustom "Rust & Ink" ----
           Bukan palet slate/zinc generik: dasar tinta hangat + aksen karat/amber
           yang dipakai berlapis-lapis, bukan flat. */
        ink: {
          50: "#f6f4f1",
          100: "#e8e3dc",
          200: "#cfc6ba",
          300: "#ad9f8d",
          400: "#8a7864",
          500: "#6f5e4d",
          600: "#594a3d",
          700: "#463a31",
          800: "#2e2721",
          900: "#1d1915",
          950: "#12100d",
        },
        rust: {
          50: "#fdf4f0",
          100: "#fae4da",
          200: "#f4c5b3",
          300: "#ec9d80",
          400: "#e2704a",
          500: "#d55128",
          600: "#b83d1c",
          700: "#932d17",
          800: "#742517",
          900: "#5f2016",
          DEFAULT: "#d55128",
        },
        moss: {
          50: "#f2f6f1",
          100: "#dfe9dd",
          200: "#bed3ba",
          300: "#93b58d",
          400: "#6a9364",
          500: "#4e7749",
          600: "#3b5e39",
          700: "#304b2f",
          800: "#283c28",
          900: "#223223",
          DEFAULT: "#4e7749",
        },
        /* token semantik berbasis CSS variable (shadcn-compatible) */
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', "system-ui", "sans-serif"],
        sans: ['"Bricolage Grotesque"', "system-ui", "sans-serif"],
        serif: ['"Instrument Serif"', "Georgia", "serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      borderRadius: {
        /* sengaja tidak seragam — sudut tajam + lengkung besar berselang */
        lg: "var(--radius)",
        md: "calc(var(--radius) - 4px)",
        sm: "calc(var(--radius) - 8px)",
        blob: "2.25rem 0.5rem 2.25rem 0.5rem",
        notch: "0.75rem 0 0.75rem 0",
      },
      boxShadow: {
        lift: "0 1px 0 0 rgba(255,255,255,0.04), 0 18px 40px -22px rgba(0,0,0,0.85)",
        "rust-glow": "0 0 0 1px rgba(213,81,40,0.35), 0 14px 40px -18px rgba(213,81,40,0.55)",
        inset: "inset 0 1px 0 0 rgba(255,255,255,0.06)",
      },
      backgroundImage: {
        "grain-fade":
          "radial-gradient(120% 90% at 12% 0%, rgba(213,81,40,0.16), transparent 55%), radial-gradient(90% 70% at 92% 12%, rgba(78,119,73,0.14), transparent 60%)",
        "rule-dashes":
          "repeating-linear-gradient(90deg, currentColor 0 6px, transparent 6px 12px)",
        "diag-hatch":
          "repeating-linear-gradient(135deg, rgba(255,255,255,0.05) 0 1px, transparent 1px 7px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.9)", opacity: "0.7" },
          "70%": { transform: "scale(1.35)", opacity: "0" },
          "100%": { transform: "scale(1.35)", opacity: "0" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        blob: {
          "0%, 100%": { borderRadius: "42% 58% 63% 37% / 41% 44% 56% 59%" },
          "50%": { borderRadius: "63% 37% 41% 59% / 58% 63% 37% 42%" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.22s ease-out",
        "accordion-up": "accordion-up 0.22s ease-out",
        marquee: "marquee 38s linear infinite",
        "pulse-ring": "pulse-ring 2.4s cubic-bezier(0.24,0,0.38,1) infinite",
        shimmer: "shimmer 2.6s ease-in-out infinite",
        blob: "blob 16s ease-in-out infinite",
      },
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
