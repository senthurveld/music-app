/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--bg-main)",
        surface: "var(--bg-surface)",
        elevated: "var(--bg-elevated)",

        foreground: "var(--text-primary)",
        muted: "var(--text-muted)",

        border: "var(--border)",

        brand: "var(--brand)",
        "brand-hover": "var(--brand-hover)",
      },
    },
  },
  plugins: [],
};
