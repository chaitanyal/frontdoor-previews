/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './northhillspsychiatry/**/*.html', './drdronavalli/**/*.html', './scripts/**/*.py'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-body)', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['var(--font-heading)', 'Georgia', 'serif'],
      },
      colors: {
        brand: {
          primary: 'var(--brand-primary)',
          accent: 'var(--brand-accent)',
          800: 'var(--brand-800)',
          900: 'var(--brand-900)',
        },
        surface: 'var(--surface)',
        warm: { 50: '#FAF8F5', 100: '#F7F3EE', 200: '#EFEAE2' },
        sage: { 50: '#F3F8F5', 100: '#DCE8E2' },
      },
      boxShadow: {
        soft: '0 10px 40px rgba(15, 23, 42, 0.06)',
        card: '0 10px 40px rgba(15, 23, 42, 0.06)',
        cardHover: '0 18px 52px rgba(15, 23, 42, 0.10)',
      },
    },
  },
};
