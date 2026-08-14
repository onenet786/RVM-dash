/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: '#030712',
        cardBg: 'rgba(15, 23, 42, 0.75)',
        accentEmerald: '#10b981',
        accentCyan: '#06b6d4',
        accentAmber: '#f59e0b',
        accentRose: '#f43f5e',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
