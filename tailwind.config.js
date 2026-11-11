module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1B2340',
        brand: { DEFAULT: '#4A5CF0', dark: '#3340C8', soft: '#ECEEFF' },
      },
      fontFamily: {
        display: ['var(--font-display)', 'ui-rounded', 'system-ui', 'sans-serif'],
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        pop: { '0%': { opacity: 0, transform: 'translateY(8px) scale(.97)' }, '100%': { opacity: 1, transform: 'none' } },
        fade: { from: { opacity: 0 }, to: { opacity: 1 } },
      },
      animation: { pop: 'pop .18s ease-out', fade: 'fade .15s ease-out' },
    },
  },
  plugins: [],
};
