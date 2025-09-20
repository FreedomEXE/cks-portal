/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx,js,jsx}',
    '../auth/src/**/*.{ts,tsx}',
    '../packages/**/*.{ts,tsx}'
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
