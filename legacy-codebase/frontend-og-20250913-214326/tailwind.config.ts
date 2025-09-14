import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f2f7ff',
          100: '#e6effe',
          200: '#c9dcfe',
          300: '#9ebffd',
          400: '#6a9bfb',
          500: '#3b7af7',
          600: '#295fe0',
          700: '#224db6',
          800: '#1f438f',
          900: '#1d3a74',
        },
        ink: {
          50:  '#f7f7f8',
          100: '#eeeeef',
          200: '#dcdde1',
          300: '#bfc2ca',
          400: '#8f96a3',
          500: '#5d6574',
          600: '#454c59',
          700: '#333a45',
          800: '#242933',
          900: '#181b22'
        },
        success: { 500: '#16a34a' },
        warning: { 500: '#f59e0b' },
        danger:  { 500: '#ef4444' }
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1rem'
      },
      boxShadow: {
        soft: '0 2px 10px rgba(0,0,0,0.06)',
        card: '0 8px 24px rgba(0,0,0,0.06)'
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography')
  ]
}

export default config