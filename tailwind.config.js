/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        athlium: {
          bg: 'var(--ath-bg)',
          surface: 'var(--ath-surface)',
          surface2: 'var(--ath-surface-2)',
          primary: 'var(--ath-primary)',
          accent: 'var(--ath-accent)',
          text: 'var(--ath-text)',
          muted: 'var(--ath-muted)',
        },
      },
      borderRadius: {
        panel: '1.25rem',
      },
      boxShadow: {
        soft: '0 12px 32px rgba(4, 10, 28, 0.45)',
      },
    },
  },
  plugins: [],
}

