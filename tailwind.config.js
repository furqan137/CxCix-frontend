/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        /** Mood palette — used across feed, chrome, and analytics */
        mood: {
          calm: { DEFAULT: '#0D9488', soft: '#99F6E4', deep: '#0F766E' },
          serious: { DEFAULT: '#1E293B', soft: '#94A3B8', deep: '#0F172A' },
          creative: { DEFAULT: '#7C3AED', soft: '#C4B5FD', deep: '#5B21B6' },
          satire: { DEFAULT: '#CA8A04', soft: '#FEF08A', deep: '#A16207' },
          debate: { DEFAULT: '#EA580C', soft: '#FDBA74', deep: '#C2410C' },
          vawulence: { DEFAULT: '#DC2626', soft: '#FECACA', deep: '#B91C1C' },
        },
        surface: {
          DEFAULT: '#F4F7F9',
          card: '#FFFFFF',
          muted: '#F4F4F5',
        },
        brand: {
          purple: '#8B3CEE',
          gold: '#D9AB6A',
          indigo: '#6366F1',
        },
      },
      fontFamily: {
        sans: ['System'],
      },
      boxShadow: {
        card: '0 4px 24px rgba(15, 23, 42, 0.08)',
        soft: '0 2px 12px rgba(15, 23, 42, 0.06)',
      },
    },
  },
  plugins: [],
};
