import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ivory: "#FAF9F6",
        paper: "#FFFFFF",
        ink: "#0F172A",
        "ink-2": "#5B6472",
        "ink-3": "#8A909C",
        emerald: {
          DEFAULT: "#0F5132",
          600: "#14663F",
          700: "#0B3E27",
          50: "#EAF2EC",
          100: "#D8E7DD",
        },
        vermilion: {
          DEFAULT: "#DC2626",
          50: "#FDF0EF",
          100: "#FADDDC",
          700: "#A81B1B",
        },
        rule: "#E6E2D8",
        "rule-strong": "#D6D1C4",
        amber: {
          DEFAULT: "#B45309",
          50: "#FBF3E7",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-display)", "Georgia", "serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        DEFAULT: "3px",
        sm: "2px",
        md: "4px",
        lg: "6px",
      },
      letterSpacing: {
        label: "0.14em",
      },
      keyframes: {
        rise: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        sweep: {
          "0%": { transform: "scaleX(0)" },
          "100%": { transform: "scaleX(1)" },
        },
        pulseSoft: {
          "0%,100%": { opacity: "1" },
          "50%": { opacity: "0.45" },
        },
      },
      animation: {
        rise: "rise 0.5s cubic-bezier(0.16,1,0.3,1) both",
        sweep: "sweep 0.7s cubic-bezier(0.16,1,0.3,1) both",
        pulseSoft: "pulseSoft 2.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
