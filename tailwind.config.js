import { heroui } from "@heroui/react";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // TechNeon theme tokens (light/dark live in src/index.css).
        background: "rgb(var(--color-background) / <alpha-value>)",
        foreground: "rgb(var(--color-foreground) / <alpha-value>)",
        primary: {
          50: "rgb(var(--color-primary-50) / <alpha-value>)",
          100: "rgb(var(--color-primary-100) / <alpha-value>)",
          200: "rgb(var(--color-primary-200) / <alpha-value>)",
          300: "rgb(var(--color-primary-300) / <alpha-value>)",
          400: "rgb(var(--color-primary-400) / <alpha-value>)",
          500: "rgb(var(--color-primary-500) / <alpha-value>)",
          600: "rgb(var(--color-primary-600) / <alpha-value>)",
          700: "rgb(var(--color-primary-700) / <alpha-value>)",
          800: "rgb(var(--color-primary-800) / <alpha-value>)",
          900: "rgb(var(--color-primary-900) / <alpha-value>)",
          DEFAULT: "rgb(var(--color-primary-500) / <alpha-value>)",
        },
        dark: {
          100: "rgb(var(--color-dark-100) / <alpha-value>)",
          200: "rgb(var(--color-dark-200) / <alpha-value>)",
          300: "rgb(var(--color-dark-300) / <alpha-value>)",
        },
        accent: {
          blue: "rgb(var(--color-accent-blue) / <alpha-value>)",
          orange: "rgb(var(--color-accent-orange) / <alpha-value>)",
        },
        // Semantic aliases to make Yacht Club usage explicit in components.
        yacht: {
          sea: "rgb(var(--color-primary-500) / <alpha-value>)",
          deep: "rgb(var(--color-primary-800) / <alpha-value>)",
          foam: "rgb(var(--color-accent-blue) / <alpha-value>)",
          sand: "rgb(var(--color-accent-orange) / <alpha-value>)",
        },
        tech: {
          neon: "rgb(var(--color-primary-500) / <alpha-value>)",
          deep: "rgb(var(--color-dark-300) / <alpha-value>)",
          cyan: "rgb(var(--color-accent-blue) / <alpha-value>)",
          mint: "rgb(var(--color-accent-orange) / <alpha-value>)",
        },
        white: "rgb(var(--color-white) / <alpha-value>)",
        black: "rgb(var(--color-black) / <alpha-value>)",
        gray: {
          300: "rgb(var(--color-gray-300) / <alpha-value>)",
          400: "rgb(var(--color-gray-400) / <alpha-value>)",
          500: "rgb(var(--color-gray-500) / <alpha-value>)",
          600: "rgb(var(--color-gray-600) / <alpha-value>)",
        },
        red: {
          500: "rgb(var(--color-red-500) / <alpha-value>)",
        },
        green: {
          400: "rgb(var(--color-green-400) / <alpha-value>)",
          500: "rgb(var(--color-green-500) / <alpha-value>)",
        },
        blue: {
          500: "rgb(var(--color-blue-500) / <alpha-value>)",
        },
        orange: {
          500: "rgb(var(--color-orange-500) / <alpha-value>)",
        },
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "Inter", "sans-serif"],
        heading: ["Outfit", "sans-serif"],
      },
    },
  },
  darkMode: "class",
  plugins: [heroui()],
};
