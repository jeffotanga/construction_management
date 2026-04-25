module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './public/index.html'
  ],
  theme: {
    extend: {
      colors: {
        navy: '#1e293b',
        'navy-dark': '#0f172a',
        'navy-light': '#334155',
        orange: '#f59e0b',
        'orange-dark': '#d97706',
        'orange-light': '#fbbf24',
        slate: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
      },
      boxShadow: {
        soft: '0 20px 60px rgba(15, 23, 42, 0.08)',
        'soft-lg': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
