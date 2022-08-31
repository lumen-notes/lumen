/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    fontFamily: {
      body: ['"iA Writer Quattro"', "system-ui", "sans-serif"],
      mono: ['"iA Writer Mono"', "monospace"],
    },
    colors: {
      transparent: "transparent",
      text: "var(--color-text)",
      "text-muted": "var(--color-text-muted)",
      "text-placeholder": "var(--color-text-placeholder)",
      bg: "var(--color-bg)",
      "bg-wash": "var(--color-bg-wash)",
      "bg-inset": "var(--color-bg-inset)",
      "bg-overlay": "var(--color-bg-overlay)",
      "bg-backdrop": "var(--color-bg-backdrop)",
      "bg-hover": "var(--color-bg-hover)",
      border: "var(--color-border)",
      "border-divider": "var(--color-border-divider)",
    },
  },
  plugins: [],
}
