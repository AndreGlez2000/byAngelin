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
        olive: {
          DEFAULT: "#6B7C5C",
          light: "#8A9E77",
          dark: "#4A5640",
        },
        parchment: {
          DEFAULT: "#F5EDD5",
          dark: "#EDE0BF",
        },
        blossom: {
          DEFAULT: "#D4929A",
          light: "#E8B4BA",
          dark: "#B8737B",
        },
        moss: {
          DEFAULT: "#9DB89A",
          light: "#B8CEB5",
        },
        "dark-olive": "#3D2B1F",
      },
      fontFamily: {
        display: ["Cormorant Garamond", "Georgia", "serif"],
        script: ["Pinyon Script", "cursive"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 2px 8px rgba(61, 43, 31, 0.08)",
        modal: "0 8px 32px rgba(61, 43, 31, 0.16)",
      },
    },
  },
  plugins: [],
};
export default config;
