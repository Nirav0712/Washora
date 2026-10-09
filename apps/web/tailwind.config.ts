import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#F6F8FB",
        surface: "#FFFFFF",
        primary: {
          DEFAULT: "#2563EB",
          50: "#EFF6FF",
          100: "#DBEAFE",
          200: "#BFDBFE",
          300: "#93C5FD",
          400: "#60A5FA",
          500: "#3B82F6",
          600: "#2563EB",
          700: "#1D4ED8",
          800: "#1E40AF",
          900: "#1E3A8A",
        },
        secondary: {
          DEFAULT: "#06B6D4",
          50: "#ECFEFF",
          100: "#CFFAFE",
          200: "#A5F3FC",
          300: "#67E8F9",
          400: "#22D3EE",
          500: "#06B6D4",
          600: "#0891B2",
          700: "#0E7490",
          800: "#155E75",
          900: "#164E63",
        },
        text: {
          DEFAULT: "#172033",
          heading: "#0F172A",
          muted: "#64748B",
        },
        border: {
          DEFAULT: "#E2E8F0",
          glass: "rgba(255, 255, 255, 0.65)",
        },
        status: {
          received: "#8B5CF6",
          processing: "#3B82F6",
          qc: "#F59E0B",
          ready: "#10B981",
          delivered: "#06B6D4",
          cancelled: "#EF4444",
        }
      },
      backgroundImage: {
        "washora-gradient": "linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)",
        "washora-gradient-subtle": "linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(6, 182, 212, 0.08) 100%)",
        "glass-card": "linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(255, 255, 255, 0.65) 100%)",
        "glass-dark": "linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(15, 23, 42, 0.65) 100%)",
      },
      boxShadow: {
        glass: "0 10px 30px -10px rgba(37, 99, 235, 0.07), 0 4px 12px -2px rgba(0, 0, 0, 0.03)",
        "glass-hover": "0 20px 40px -12px rgba(37, 99, 235, 0.12), 0 8px 16px -4px rgba(0, 0, 0, 0.04)",
        "glow-blue": "0 0 20px -3px rgba(37, 99, 235, 0.35)",
        "glow-cyan": "0 0 20px -3px rgba(6, 182, 212, 0.35)",
      },
      fontFamily: {
        sans: ["Outfit", "Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
    },
  },
  plugins: [],
};
export default config;
