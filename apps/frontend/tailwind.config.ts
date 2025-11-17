import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontSize: {
        'xs': '1.1rem',
        'sm': '1.2rem',
        'base': '1.4rem',
        'lg': '1.6rem',
        'xl': '1.8rem',
        '2xl': '2.0rem',
        '3xl': '2.4rem',
        '4xl': '3.0rem',
      },
      colors: {
        // Innovation Light theme colors for NPD module
        'npd-bg': '#f9fafb', // gray-50
        'npd-primary': '#3b82f6', // blue-500
        // Stage-Gate colors
        'gate-0': '#ef4444', // red-500 (Idea)
        'gate-1': '#ea580c', // orange-600 (Concept)
        'gate-2': '#f59e0b', // amber-500 (Development)
        'gate-3': '#84cc16', // lime-500 (Testing)
        'gate-4': '#16a34a', // green-600 (Launch)
      },
    },
  },
  plugins: [],
} satisfies Config;
