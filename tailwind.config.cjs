/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  future: {
    hoverOnlyWhenSupported: true,
  },
  theme: {
    extend: {
      screens: {
        coarse: { raw: "(pointer: coarse)" },
        fine: { raw: "(pointer: fine)" },
        "2x": { raw: "(min-resolution: 192dpi)" },
      },
      fontWeight: {
        semibold: "550",
        bold: "650",
      },
    },
    fontFamily: {
      body: ['"iA Writer Quattro"', "system-ui", "sans-serif"],
      mono: ['"iA Writer Mono"', "monospace"],
    },
    fontSize: {
      sm: "var(--font-size-sm)",
      base: "var(--font-size-base)",
      lg: "var(--font-size-lg)",
      xl: "var(--font-size-xl)",
    },
    colors: {
      transparent: "transparent",
      current: "currentColor",
      neutral: {
        1: "var(--neutral-1)",
        2: "var(--neutral-2)",
        3: "var(--neutral-3)",
        4: "var(--neutral-4)",
        5: "var(--neutral-5)",
        6: "var(--neutral-6)",
        7: "var(--neutral-7)",
        8: "var(--neutral-8)",
        9: "var(--neutral-9)",
        10: "var(--neutral-10)",
        11: "var(--neutral-11)",
        12: "var(--neutral-12)",
        contrast: "var(--neutral-contrast)",
      },
      text: {
        DEFAULT: "var(--color-text)",
        secondary: "var(--color-text-secondary)",
        tertiary: "var(--color-text-tertiary)",
        highlight: "var(--color-text-highlight)",
        danger: "var(--color-text-danger)",
      },
      bg: {
        DEFAULT: "var(--color-bg)",
        inset: "var(--color-bg-inset)",
        overlay: "var(--color-bg-overlay)",
        backdrop: "var(--color-bg-backdrop)",
        secondary: "var(--color-bg-secondary)",
        tertiary: "var(--color-bg-tertiary)",
        "code-block": "var(--color-bg-code-block)",
        highlight: "var(--color-bg-highlight)",
        selection: "var(--color-bg-selection)",
      },
      border: {
        DEFAULT: "var(--color-border)",
        secondary: "var(--color-border-secondary)",
        table: "var(--color-border-table)",
        focus: "var(--color-border-focus)",
      },
    },
    borderRadius: {
      none: "0",
      xs: "0.1875rem", // 3px (base / 2)
      sm: "0.375rem", // 6px (base)
      md: "0.625rem", // 10px (base + 4px)
      lg: "0.875rem", // 14px (base + 8px)
      full: "9999px",
    },
  },
  plugins: [require("@tailwindcss/container-queries"), require("tailwindcss-animate")],
}
