import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#0a1628",
          50: "#1a2942",
          100: "#0f1c33",
          900: "#050d1a"
        },
        cream: {
          DEFAULT: "#f5efe2",
          100: "#faf5ea",
          200: "#ede5d2"
        },
        gold: {
          DEFAULT: "#d4a04a",
          50: "#e3b76a",
          100: "#d4a04a",
          200: "#b88838"
        }
      },
      fontFamily: {
        serif: ["'Playfair Display'", "Georgia", "serif"],
        sans: ["'Inter'", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "monospace"]
      }
    }
  },
  plugins: []
};

export default config;
