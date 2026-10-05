import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        felt: { DEFAULT: "#0f5c3a", dark: "#0a3d27", light: "#168a57" },
      },
      keyframes: {
        deal: {
          "0%": { transform: "translateY(-60px) scale(0.8)", opacity: "0" },
          "100%": { transform: "translateY(0) scale(1)", opacity: "1" },
        },
      },
      animation: { deal: "deal 0.35s ease-out" },
    },
  },
  plugins: [],
};

export default config;
