/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        display: ['"Cormorant Garamond"', 'serif'],
        heading: ['"Inter Tight"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        void: "#080808",
        panel: "#111111",
        surface: "#1A1A1A",
        gold: {
          DEFAULT: "#C9A84C",
          light: "#E2C06A",
          dim: "#8A6F2E",
        },
        ivory: "#FAF8F2",
        muted: "#A89880",
        overlay: "#0D0D0D", // Added overlay color for modals
        status: {
          green: "#4ADE80",
          red: "#F87171",
          amber: "#FCD34D",
        }
      },
      borderRadius: {
        lg: `var(--radius)`,
        md: `calc(var(--radius) - 2px)`,
        sm: "calc(var(--radius) - 4px)",
      },
      animation: {
        "pulse-dot": "pulse 1.5s cubic-bezier(0.4,0,0.6,1) infinite",
        scroll: "scroll 35s linear infinite",
      },
      keyframes: {
        scroll: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
    },
  },
  plugins: [],
};
