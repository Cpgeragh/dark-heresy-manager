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
        code: ['RobotoMonoZero', 'Roboto', 'ui-sans-serif', 'sans-serif'],
      cinzel: ["'Cinzel'", 'serif'],
      },
    },
  },
  plugins: [],
};