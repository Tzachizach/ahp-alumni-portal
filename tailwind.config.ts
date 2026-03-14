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
          light: "#D4000015",
        },
        "ohio-gray": {
          DEFAULT: "#666666",
          light: "#F5F5F5",
          medium: "#E0E0E0",
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
