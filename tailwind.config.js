import { heroui } from "@heroui/react";
import { md3 } from "./src/theme/md3-tokens.ts";

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
        sans: ["Roboto Flex", "Inter", "sans-serif"],
        heading: ["Roboto Flex", "sans-serif"],
      },
      borderRadius: {
        sm: "0.5rem",   // M3 shape-corner-small (8px) — inputs, chips
        md: "0.75rem",  // M3 shape-corner-medium (12px) — cards, buttons
        lg: "1rem",     // M3 shape-corner-large (16px)
        xl: "1.75rem",  // M3 shape-corner-extra-large (28px) — modals, drawers
      },
      // Single source of truth for interactive control heights (WCAG 2.5.5).
      // Mirrored as CSS vars in src/index.css (`--control-height-*`). The touch
      // floor (44px) is also enforced globally for coarse pointers there.
      height: {
        "control-sm": "2.75rem", // 44px — minimum touch target
        "control-md": "3rem",    // 48px
        "control-lg": "3.5rem",  // 56px
      },
      minHeight: {
        touch: "2.75rem",          // 44px
        "control-sm": "2.75rem",   // 44px
        "control-md": "3rem",      // 48px
        "control-lg": "3.5rem",    // 56px
      },
      minWidth: {
        touch: "2.75rem",          // 44px
        "control-sm": "2.75rem",   // 44px
        "control-md": "3rem",      // 48px
        "control-lg": "3.5rem",    // 56px
      },
    },
  },
  darkMode: "class",
  plugins: [
    heroui({
      // M3 radii applied to every HeroUI component slot.
      layout: {
        radius: {
          small: "0.5rem", // shape-corner-small
          medium: "0.75rem", // shape-corner-medium
          large: "1rem", // shape-corner-large
        },
      },
      themes: {
        light: { colors: md3.light.heroui },
        dark: { colors: md3.dark.heroui },
      },
    }),
  ],
};
