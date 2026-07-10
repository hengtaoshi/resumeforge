/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Noto Sans SC"', '"PingFang SC"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
