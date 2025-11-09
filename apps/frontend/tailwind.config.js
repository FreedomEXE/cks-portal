/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{ts,tsx,js,jsx,css}',
    '../../auth/src/**/*.{ts,tsx,css}',
    '../../auth/dist/**/*.{js,jsx,css}',
    '../../packages/ui/src/**/*.{ts,tsx,css}',
    '../../packages/ui/dist/**/*.{js,jsx,css}',
    '../../packages/domain-widgets/src/**/*.{ts,tsx,css}',
    '../../packages/domain-widgets/dist/**/*.{js,jsx,css}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          300: '#93c5fd',
          500: '#3b82f6',
          600: '#2563eb'
        }
      }
    }
  },
  plugins: []
}
