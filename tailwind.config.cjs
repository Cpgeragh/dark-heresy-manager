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
      keyframes: {
        psyPulse: {
          '0%, 100%': { boxShadow: 'var(--glow-lo)' },
          '50%': { boxShadow: 'var(--glow-hi)' },
        },
      },
      animation: {
        'psy-pulse': 'psyPulse 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};