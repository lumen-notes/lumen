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
      "current-color": "currentColor",
      text: "var(--color-text)",
      "text-secondary": "var(--color-text-secondary)",
      "text-tertiary": "var(--color-text-tertiary)",
      "text-highlight": "var(--color-text-highlight)",
      bg: "var(--color-bg)",
      "bg-inset": "var(--color-bg-inset)",
      "bg-overlay": "var(--color-bg-overlay)",
      "bg-backdrop": "var(--color-bg-backdrop)",
      "bg-inset-backdrop": "var(--color-bg-inset-backdrop)",
      "bg-overlay-backdrop": "var(--color-bg-overlay-backdrop)",
      "bg-secondary": "var(--color-bg-secondary)",
      "bg-tertiary": "var(--color-bg-tertiary)",
      "bg-highlight": "var(--color-bg-highlight)",
      border: "var(--color-border)",
      "border-secondary": "var(--color-border-secondary)",
      "border-focus": "var(--color-border-focus)",
    },
  },
  plugins: [require("@tailwindcss/container-queries")],
}
