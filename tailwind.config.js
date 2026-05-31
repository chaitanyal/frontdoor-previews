/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./sites/**/*.html', './scripts/generate_provider_pages.py', './shared/**/*.js'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-body)', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['var(--font-heading)', 'Georgia', 'serif'],
      },
      colors: {
        primary: 'var(--color-primary)',
        primaryHover: 'var(--color-primary-hover)',
        sage: { 50: 'var(--color-sage)', 100: 'var(--color-sage)' },
        surface: 'var(--color-surface)',
        card: 'var(--color-card)',
        textPrimary: 'var(--color-text-primary)',
        textSecondary: 'var(--color-text-secondary)',
        border: 'var(--color-border)',
        success: 'var(--color-success)',
        brand: {
          primary: 'var(--color-primary)',
          accent: 'var(--color-success)',
          800: 'var(--color-primary-hover)',
          900: 'var(--color-text-primary)',
        },
        warm: { 50: 'var(--color-surface)', 100: 'var(--color-surface)', 200: 'var(--color-surface)' },
        slate: {
          50: 'var(--color-border)',
          100: 'var(--color-border)',
          200: 'var(--color-border)',
          300: 'var(--color-border)',
          500: 'var(--color-text-secondary)',
          600: 'var(--color-text-secondary)',
          700: 'var(--color-text-secondary)',
          800: 'var(--color-text-primary)',
          900: 'var(--color-text-primary)',
          950: 'var(--color-text-primary)',
        },
      },
      boxShadow: {
        soft: '0 10px 40px rgba(15, 23, 42, 0.06)',
        card: '0 10px 40px rgba(15, 23, 42, 0.06)',
        cardHover: '0 18px 52px rgba(15, 23, 42, 0.10)',
      },
    },
  },
};
