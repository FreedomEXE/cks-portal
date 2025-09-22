/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx,js,jsx}',
    // Scan auth for classes used in Login/guards
    '../../auth/src/**/*.{ts,tsx,css}',
    '../../auth/dist/**/*.{js,jsx,css}',
    // Existing globs for ui/domain-widgets...
    '../../packages/ui/src/**/*.{ts,tsx}'
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
