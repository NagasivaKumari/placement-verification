/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        blue: {
          600: '#2563eb',
          700: '#1d4ed8',
        },
        purple: {
          600: '#9333ea',
        },
      },
    },
  },
  plugins: [],
}
