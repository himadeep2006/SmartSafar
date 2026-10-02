/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        midnight: {
          950: "#050914",
          900: "#0b1329",
          800: "#101b3b",
          700: "#18274d",
          600: "#223563",
          500: "#2e467d",
        },
        sunset: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
        },
        safari: {
          blue: "#1684ef",
          sky: "#00b4d8",
          indigo: "#4f46e5",
          gold: "#e6a100",
        },
        primary: {
          50: "#f0f7ff",
          100: "#e0effe",
          500: "#1684ef",
          600: "#0284c7",
          700: "#0369a1",
        },
        secondary: {
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
        },
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.25)",
        "glass-hover": "0 12px 40px 0 rgba(0, 0, 0, 0.35)",
        "gold-glow": "0 0 20px rgba(245, 158, 11, 0.35)",
        "blue-glow": "0 0 20px rgba(22, 132, 239, 0.35)",
      },
      backdropBlur: {
        xs: "4px",
      }
    },
  },
  plugins: [],
}

