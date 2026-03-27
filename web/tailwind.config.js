/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9f1',
          100: '#dcf1df',
          200: '#bbe3c2',
          300: '#8fcd9b',
          400: '#5eaf6f',
          500: '#3e9150',
          600: '#2e753d',
          700: '#265d33',
          800: '#214a2b',
          900: '#1c3e26',
          950: '#0f2214',
        },
      },
    },
  },
  plugins: [],
}
