/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0a0a12',
        surface: '#12121e',
        card: '#1a1a2e',
        'card-hover': '#22223a',
        accent: '#7c3aed',
        'accent-light': '#a78bfa',
        'accent-dim': '#4c1d95',
        pink: '#ec4899',
        'pink-dim': '#9d174d',
        success: '#22c55e',
        warning: '#f59e0b',
        muted: '#475569',
        subtle: '#1e1e30',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
