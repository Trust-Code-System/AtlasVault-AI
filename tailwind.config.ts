import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#dce7fd",
          200: "#c0d4fc",
          300: "#95b8f9",
          400: "#6392f4",
          500: "#3f6eee",
          600: "#2a4fe2",
          700: "#223cd0",
          800: "#2233a9",
          900: "#213085",
          950: "#181f51",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(16 24 40 / 0.06), 0 1px 3px 0 rgb(16 24 40 / 0.1)",
      },
    },
  },
  plugins: [],
};
export default config;
