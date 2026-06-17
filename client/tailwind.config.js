/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0b0d12",
        surface: "#14171f",
        "surface-2": "#1b1f2a",
        border: "#262b38",
        muted: "#8b93a4",
        accent: {
          DEFAULT: "#7c5cff",
          hover: "#6b4af0",
          soft: "#a78bfa",
        },
        ok: "#34d399",
        bad: "#f87171",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 1px 0 0 rgba(255,255,255,0.03) inset, 0 8px 24px -12px rgba(0,0,0,0.6)",
        "card-deep":
          "0 1px 0 0 rgba(255,255,255,0.08) inset, 0 18px 44px -18px rgba(0,0,0,0.8)",
        "glow-accent":
          "0 10px 24px -8px rgba(124,92,255,0.55), 0 0 0 1px rgba(124,92,255,0.25)",
      },
    },
  },
  plugins: [],
};
