import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#1a1a2e",
        paper: "#faf8f5",
        copper: {
          DEFAULT: "#c4722f",
          light: "#d4944f",
          dark: "#a45a1f",
        },
        ledger: "#e8e0d4",
        success: "#2d6a4f",
      },
      fontFamily: {
        display: ["var(--font-dm-serif)", "serif"],
        body: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-jetbrains)", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;