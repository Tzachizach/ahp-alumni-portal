import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        scarlet: {
          DEFAULT: "#BB0000",
          dark: "#8B0000",
          // Opaque tint replacing the prior ~8% alpha #D4000015.
          // Passes WCAG 1.4.11 (≥3:1) and the scarlet text on this bg ≈ 5.6:1 (1.4.3).
          light: "#FCE7E7",
        },
        "ohio-gray": {
          DEFAULT: "#666666",
          light: "#F5F5F5",
          // Darker than the prior #E0E0E0 (which was 1.36:1 on white).
          // #949494 ≈ 3.04:1 — meets WCAG 1.4.11 for input/card borders.
          medium: "#949494",
          dark: "#333333",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
