/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'cinema-black': '#0A0A14',
        'cinema-dark': '#12122A',
        'cinema-surface': '#1A1A3E',
        'cinema-surface-hover': '#222250',
        'vivid-purple': {
          400: '#A78BFA',
          500: '#8B5CF6',
          600: '#7C3AED',
        },
        'electric-teal': {
          400: '#34D399',
          500: '#10B981',
        },
        'hot-pink': {
          500: '#F43F5E',
        },
        golden: '#FFD166',
        'cinema-text': '#F8FAFC',
        'cinema-text-muted': '#B8B8D0',
      },
      fontFamily: {
        sans: ['-apple-system', 'PingFang SC', 'Noto Sans SC', 'Microsoft YaHei', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
