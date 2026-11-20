/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        gym: {
          bg: '#E5E8CE',
          secondary: '#F1F2E8',
          card: '#F1F2E8',
          primary: '#173F35',
          accent: '#789575',
          heading: '#263B2D',
          textMuted: '#657565',
          border: '#D2D9C5',
          footer: '#173F35',
          footerBottom: '#102E27',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        emerald: '0 8px 24px -6px rgba(23, 63, 53, 0.1)',
        'emerald-lg': '0 16px 40px -10px rgba(23, 63, 53, 0.16)',
      },
    },
  },
  plugins: [],
};
