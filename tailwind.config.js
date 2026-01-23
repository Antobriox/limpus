/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // Usa el modo oscuro según la clase 'dark' en el elemento html
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontSize: {
        'xs': ['0.875rem', { lineHeight: '1.25rem' }],      // 14px -> ~15.75px
        'sm': ['0.9375rem', { lineHeight: '1.375rem' }],   // 15px -> ~16.875px
        'base': ['1.125rem', { lineHeight: '1.75rem' }],   // 18px -> ~20.25px
        'lg': ['1.25rem', { lineHeight: '1.875rem' }],     // 20px -> ~22.5px
        'xl': ['1.375rem', { lineHeight: '2rem' }],        // 22px -> ~24.75px
        '2xl': ['1.6875rem', { lineHeight: '2.25rem' }],   // 27px -> ~30.375px
        '3xl': ['2.125rem', { lineHeight: '2.5rem' }],     // 34px -> ~38.25px
        '4xl': ['2.625rem', { lineHeight: '3rem' }],       // 42px -> ~47.25px
        '5xl': ['3.5rem', { lineHeight: '1' }],            // 56px -> ~63px
        '6xl': ['4.375rem', { lineHeight: '1' }],          // 70px -> ~78.75px
      },
      spacing: {
        '18': '4.5rem',   // 72px
        '22': '5.5rem',   // 88px
        '26': '6.5rem',   // 104px
        '30': '7.5rem',   // 120px
      },
    },
  },
  plugins: [],
};
