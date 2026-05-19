/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#eef4ff',
          100: '#d9e8ff',
          200: '#bcd5fe',
          300: '#8eb8fc',
          400: '#5990f8',
          500: '#3b6ff2',
          600: '#234ee7',
          700: '#1b3bd4',
          800: '#1c31ab',
          900: '#1c2f88',
          950: '#151f54',
        },
        surface: {
          900: '#0d1117',
          800: '#161b22',
          700: '#21262d',
          600: '#30363d',
          500: '#3d444d',
        },
        accent: {
          teal:   '#06b6d4',
          purple: '#8b5cf6',
          amber:  '#f59e0b',
          rose:   '#f43f5e',
          green:  '#10b981',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
        mono: ['JetBrains Mono', 'ui-monospace'],
      },
      animation: {
        'fade-in':   'fadeIn 0.3s ease-in-out',
        'slide-up':  'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn:  { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(12px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};
