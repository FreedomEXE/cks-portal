/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx,js,jsx}',
    '../Auth/src/**/*.{ts,tsx}',
    '../Frontend/src/**/*.{ts,tsx}',
    '../../packages/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          // Original brand palette (blue)
          300: '#93c5fd', // blue-300
          500: '#3b82f6', // blue-500
          600: '#2563eb'  // blue-600
        }
      }
    }
  },
  plugins: []
}
