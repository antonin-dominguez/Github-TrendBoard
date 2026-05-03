/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      colors: {
        bg: {
          base:    "rgb(var(--bg-base-rgb) / <alpha-value>)",
          subtle:  "rgb(var(--bg-subtle-rgb) / <alpha-value>)",
          muted:   "rgb(var(--bg-muted-rgb) / <alpha-value>)",
          overlay: "rgb(var(--bg-overlay-rgb) / <alpha-value>)",
        },
        border: {
          DEFAULT: "var(--border-color)",
          strong:  "var(--border-strong)",
        },
        brand: {
          DEFAULT: "#6366F1",
          muted:   "rgba(99,102,241,0.15)",
          subtle:  "rgba(99,102,241,0.08)",
        },
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.6)",
        glow: "0 0 20px rgba(99,102,241,0.15)",
      },
      animation: {
        "fade-in":    "fadeIn 0.15s ease-out",
        "slide-down": "slideDown 0.2s ease-out",
      },
      keyframes: {
        fadeIn:    { from: { opacity: 0 }, to: { opacity: 1 } },
        slideDown: {
          from: { opacity: 0, transform: "translateY(-4px)" },
          to:   { opacity: 1, transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
