// eslint-disable-next-line @typescript-eslint/no-var-requires
const plugin = require("tailwindcss/plugin")

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  future: {
    hoverOnlyWhenSupported: true,
  },
  theme: {
    fontFamily: {
      body: ['"iA Writer Quattro"', "system-ui", "sans-serif"],
      mono: ['"iA Writer Mono"', "monospace"],
    },
    colors: {
      transparent: "transparent",
      "current-color": "currentColor",
      text: "var(--color-text)",
      "text-secondary": "var(--color-text-secondary)",
      "text-tertiary": "var(--color-text-tertiary)",
      "text-highlight": "var(--color-text-highlight)",
      "text-pending": "var(--color-text-pending)",
      bg: "var(--color-bg)",
      "bg-inset": "var(--color-bg-inset)",
      "bg-overlay": "var(--color-bg-overlay)",
      "bg-backdrop": "var(--color-bg-backdrop)",
      "bg-inset-backdrop": "var(--color-bg-inset-backdrop)",
      "bg-overlay-backdrop": "var(--color-bg-overlay-backdrop)",
      "bg-secondary": "var(--color-bg-secondary)",
      "bg-tertiary": "var(--color-bg-tertiary)",
      "bg-highlight": "var(--color-bg-highlight)",
      "bg-pending": "var(--color-bg-pending)",
      border: "var(--color-border)",
      "border-secondary": "var(--color-border-secondary)",
      "border-focus": "var(--color-border-focus)",
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
  plugins: [
    require("@tailwindcss/container-queries"),
    require("tailwindcss-animate"),
    plugin(function ({ addVariant }) {
      addVariant("touch", "@media (pointer: coarse)")
    }),
  ],
}
