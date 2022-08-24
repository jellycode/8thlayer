/** @type {import('tailwindcss').Config} */
module.exports = {
 content: [
  './assets/**/*.{css,js}',
  './layout/**/*.liquid',
  './sections/**/*.{html,js,liquid}',
  './snippets/**/*.liquid',
  './templates/**/*.{json,liquid}',
 ],
 theme: {
  container: {
   padding: {
    DEFAULT: '1rem',
    sm: '2rem',
    lg: '4rem',
    xl: '5rem',
    '2xl': '6rem',
   },
  },
  extend: {
   colors: {
    pink: {
     300: '#dd94ac',
     500: '#e4007f',
    },
   },
  },
 },
 plugins: [],
};
