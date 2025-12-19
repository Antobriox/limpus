/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // Usa el modo oscuro según la clase 'dark' en el elemento html
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
