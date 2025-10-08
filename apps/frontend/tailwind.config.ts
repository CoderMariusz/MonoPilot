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
    },
  },
  plugins: [],
} satisfies Config;
