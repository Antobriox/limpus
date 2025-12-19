/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'media', // Usa el modo oscuro según el sistema
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
