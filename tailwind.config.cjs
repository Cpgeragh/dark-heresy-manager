/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  future: {
    hoverOnlyWhenSupported: true,
  },
  theme: {
    extend: {
      fontFamily: {
        code: ["'IM Fell English'", 'Georgia', 'serif'],
      cinzel: ["'Cinzel'", 'serif'],
      },
    },
  },
  plugins: [],
};