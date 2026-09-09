/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'xs': '480px',
        '3xl': '1920px',
        '4xl': '2560px',
      },
      colors: {
        darkBg: '#030712',
        cardBg: 'rgba(15, 23, 42, 0.75)',
        accentEmerald: '#10b981',
        accentCyan: '#06b6d4',
        accentAmber: '#f59e0b',
        accentRose: '#f43f5e',
        // ISP Environmental Solutions Theme Tokens
        brand: {
          primary: {
            DEFAULT: '#0B5D3B',
            hover: '#08422A',
            light: '#E6F3EC',
            subtle: '#F0F7F3',
          },
          accent: {
            DEFAULT: '#E5A919',
            hover: '#C8900E',
            light: '#FEF8E8',
          },
        },
        neutral: {
          slate: '#1E293B',
          secondary: '#475569',
          muted: '#64748B',
          subtle: '#94A3B8',
          border: '#E2E8F0',
          divider: '#EDF2F7',
        },
        canvas: {
          app: '#F8FAFC',
          surface: '#FFFFFF',
          section: '#F1F5F9',
        },
        semantic: {
          success: { DEFAULT: '#16A34A', bg: '#F0FDF4', text: '#15803D' },
          warning: { DEFAULT: '#D97706', bg: '#FFFBEB', text: '#B45309' },
          danger:  { DEFAULT: '#DC2626', bg: '#FEF2F2', text: '#B91C1C' },
          info:    { DEFAULT: '#0284C7', bg: '#F0F9FF', text: '#0369A1' },
        },
      },
      boxShadow: {
        'card-soft': '0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
        'card-hover': '0 8px 20px -3px rgba(11, 93, 59, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.03)',
        'accent-glow': '0 0 16px -2px rgba(229, 169, 25, 0.40)',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
