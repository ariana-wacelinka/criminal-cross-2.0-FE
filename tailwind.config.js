/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        athlium: {
          bg: 'rgb(var(--ath-bg-rgb) / <alpha-value>)',
          'bg-deep': 'rgb(var(--ath-bg-deep-rgb) / <alpha-value>)',
          surface: 'rgb(var(--ath-surface-rgb) / <alpha-value>)',
          'surface-2': 'rgb(var(--ath-surface-2-rgb) / <alpha-value>)',
          primary: 'rgb(var(--ath-primary-rgb) / <alpha-value>)',
          'primary-soft': 'rgb(var(--ath-primary-soft-rgb) / <alpha-value>)',
          accent: 'rgb(var(--ath-accent-rgb) / <alpha-value>)',
          danger: 'rgb(var(--ath-danger-rgb) / <alpha-value>)',
          text: 'rgb(var(--ath-text-rgb) / <alpha-value>)',
          muted: 'rgb(var(--ath-muted-rgb) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['Manrope', 'Segoe UI', 'sans-serif'],
        title: ['Sora', 'Manrope', 'Segoe UI', 'sans-serif'],
      },
      borderRadius: {
        panel: '1.25rem',
      },
      boxShadow: {
        soft: '0 18px 36px rgba(2, 8, 24, 0.45)',
      },
    },
  },
  plugins: [],
};
