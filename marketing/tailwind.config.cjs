/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/entries/marketing/**/*.astro', './src/components/marketing/**/*.astro', './src/layouts/MarketingLayout.astro'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#EEF4FA',
          100: '#DCE8E2',
          700: '#1E3A5F',
          900: '#16304F',
        },
        warm: {
          50: '#FAF8F5',
          100: '#F7F4EF',
          200: '#F3EFE9',
        },
        sage: {
          100: '#DCE8E2',
          700: '#426B5B',
        },
        slate: {
          500: '#475569',
        },
        border: {
          100: '#E2E8F0',
        },
        success: {
          600: '#2F855A',
        },
      },
    },
  },
};
