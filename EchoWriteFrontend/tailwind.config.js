/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class', // Add this line to enable class-based dark mode
  theme: {
    extend: {
      // You can define dark mode specific colors here if needed,
      // but often you'll just use dark:bg-gray-800 etc.
      colors: {
        'dark-bg': '#1a202c',
        'dark-text': '#e2e8f0',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'), // Add this line
  ],
}