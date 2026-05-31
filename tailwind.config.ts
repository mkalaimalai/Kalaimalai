import type { Config } from "tailwindcss";

/**
 * Elder-first design tokens (PRD N5). Larger base type, generous spacing,
 * WCAG-aligned contrast. An "elder mode" can scale these via CSS variables.
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        brand: "hsl(var(--brand))",
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        border: "hsl(var(--border))",
        maternal: "hsl(var(--maternal))",
        paternal: "hsl(var(--paternal))",
      },
      fontSize: {
        // Elder-first: bump the base scale.
        base: ["1.0625rem", { lineHeight: "1.6" }],
      },
      minHeight: {
        target: "44px", // minimum touch target
      },
      minWidth: {
        target: "44px",
      },
    },
  },
  plugins: [],
};

export default config;
