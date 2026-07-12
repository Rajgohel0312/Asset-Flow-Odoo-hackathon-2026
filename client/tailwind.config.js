/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f7fa',
          100: '#e4e8f0',
          200: '#c8d1e2',
          300: '#9fb0cd',
          400: '#7088b3',
          500: '#4f6999',
          600: '#3e527c',
          700: '#324263',
          800: '#252f47',
          900: '#1b2132',
        }
      }
    },
  },
  plugins: [],
}
