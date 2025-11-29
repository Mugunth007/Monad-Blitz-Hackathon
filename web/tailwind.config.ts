import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        monad: {
          primary: "#6c54f8",
          light: "#8b6ffb",
          dark: "#4f3cd4",
          bg: "#0a0a0f",
        },
        // Hero UI inspired palette
        zinc: {
          50: "#fafafa",
          100: "#f4f4f5",
          200: "#e4e4e7",
          300: "#d4d4d8",
          400: "#a1a1aa",
          500: "#71717a",
          600: "#52525b",
          700: "#3f3f46",
          800: "#27272a",
          900: "#18181b",
          950: "#09090b",
        },
      },
      backgroundImage: {
        'monad-gradient': 'linear-gradient(135deg, #6c54f8 0%, #8b6ffb 100%)',
        'monad-bg': 'linear-gradient(135deg, #0a0a0f 0%, #1a1628 50%, #2a1a3f 70%, #0a0a0f 100%)',
        'hero-glow': 'conic-gradient(from 180deg at 50% 50%, #6c54f8 0deg, #8b6ffb 180deg, #6c54f8 360deg)',
      },
      backdropBlur: {
        'glass': '20px',
      },
      animation: {
        'pulse-glow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'hero': '0 0 40px -10px rgba(108, 84, 248, 0.3)',
      },
    },
  },
  plugins: [],
};
export default config;