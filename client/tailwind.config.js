/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class", '[data-theme="dark"]'],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Claude Design tokens — driven by CSS variables (light/dark via data-theme).
        bg: "var(--bg)",
        panel: "var(--panel)",
        rail: "var(--rail)",
        // Back-compat aliases used across older pages.
        surface: "var(--panel)",
        "surface-2": "var(--rail)",
        fg: "var(--fg)",
        muted: "var(--muted)",
        faint: "var(--faint)",
        border: "var(--border)",
        accent: {
          DEFAULT: "var(--accent)",
          soft: "var(--accent-soft)",
          weak: "var(--accent-weak)",
        },
        ok: "#34d399",
        bad: "#f87171",
      },
      fontFamily: {
        sans: [
          "'Be Vietnam Pro'",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "sans-serif",
        ],
        display: ["var(--disp)", "Newsreader", "Georgia", "serif"],
      },
      borderRadius: {
        card: "var(--radius)",
      },
      boxShadow: {
        card: "0 6px 18px -12px rgba(0,0,0,0.35)",
        "card-hover": "0 12px 28px -16px rgba(0,0,0,0.3)",
        "card-deep": "0 24px 60px -28px rgba(0,0,0,0.4)",
        "glow-accent": "0 6px 16px -8px var(--accent)",
      },
    },
  },
  plugins: [],
};
