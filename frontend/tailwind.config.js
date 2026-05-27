/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          DEFAULT: '#0e1229',
          50: '#1a1f3a',
          100: '#151a33',
          200: '#0e1229',
          300: '#0a0d1f',
        },
        accent: {
          DEFAULT: '#a968cd',
          50: '#c49de0',
          100: '#b57ed6',
          200: '#a968cd',
          300: '#8f4fb3',
          400: '#753d99',
        },
      },
    },
  },
  plugins: [],
}
