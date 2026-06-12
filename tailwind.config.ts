import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      fontFamily: {
        sans: [
          "Myriad Pro",
          "Segoe UI",
          "Open Sans",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
      },
      colors: {
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
        utmach: {
          DEFAULT: "hsl(var(--utmach))",
          foreground: "hsl(var(--utmach-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
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
        // Animación de apertura del formulario
        "intro-rise": {
          "0%": { opacity: "0", transform: "translateY(16px)", filter: "blur(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)", filter: "blur(0)" },
        },
        "intro-line": {
          "0%": { width: "0", opacity: "0.4" },
          "100%": { width: "6rem", opacity: "1" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "none" },
        },
        // Tipografía cinética de la animación de apertura
        "word-in-l": {
          "0%": {
            opacity: "0",
            transform: "translateX(-160%) skewX(-14deg)",
            filter: "blur(12px)",
          },
          "55%": { opacity: "1", filter: "blur(0)" },
          "100%": {
            opacity: "1",
            transform: "translateX(0) skewX(0)",
            filter: "blur(0)",
          },
        },
        "word-in-r": {
          "0%": {
            opacity: "0",
            transform: "translateX(160%) skewX(14deg)",
            filter: "blur(12px)",
          },
          "55%": { opacity: "1", filter: "blur(0)" },
          "100%": {
            opacity: "1",
            transform: "translateX(0) skewX(0)",
            filter: "blur(0)",
          },
        },
        "marquee-l": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "marquee-r": {
          "0%": { transform: "translateX(-50%)" },
          "100%": { transform: "translateX(0)" },
        },
        "sweep-x": {
          "0%": { transform: "translateX(-130%)", opacity: "0" },
          "25%": { opacity: "1" },
          "100%": { transform: "translateX(130%)", opacity: "0" },
        },
        "pop-in": {
          "0%": { opacity: "0", transform: "scale(0.55)", filter: "blur(12px)" },
          "60%": { opacity: "1", filter: "blur(0)" },
          "100%": { opacity: "1", transform: "scale(1)", filter: "blur(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "intro-rise": "intro-rise 0.7s cubic-bezier(0.16,1,0.3,1) both",
        "intro-line": "intro-line 0.6s ease-out both",
        "fade-in-up": "fade-in-up 0.6s cubic-bezier(0.16,1,0.3,1) both",
        "word-in-l": "word-in-l 0.62s cubic-bezier(0.22,1,0.3,1) both",
        "word-in-r": "word-in-r 0.62s cubic-bezier(0.22,1,0.3,1) both",
        "marquee-l": "marquee-l 7s linear infinite",
        "marquee-r": "marquee-r 9s linear infinite",
        "sweep-x": "sweep-x 1.1s ease-in-out both",
        "pop-in": "pop-in 0.7s cubic-bezier(0.2,1.25,0.3,1) both",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
