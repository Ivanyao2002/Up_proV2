import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/portals/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/shared/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#405189",
          dark: "#364574",
          hero: "#2f3d66",
        },
        teal: {
          DEFAULT: "#0ab39c",
          dark: "#099885",
        },
        canvas: "#f3f3f9",
        surface: "#ffffff",
        muted: "#878a99",
        border: "#e9ebec",
      },
      fontFamily: {
        sans: ["var(--font-poppins)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "14px",
        hero: "20px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(33,37,41,0.04), 0 8px 24px rgba(64,81,137,0.06)",
      },
      transitionTimingFunction: {
        premium: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "pulse-ring": {
          "0%, 100%": { opacity: "0.4", transform: "scale(1)" },
          "50%": { opacity: "0.15", transform: "scale(1.15)" },
        },
      },
      animation: {
        "fade-up": "fade-up 400ms cubic-bezier(0.22, 1, 0.36, 1) forwards",
        shimmer: "shimmer 1.2s linear infinite",
        "pulse-ring": "pulse-ring 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
