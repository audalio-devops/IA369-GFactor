/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        matrix: {
          black: '#0A0A0A',
          gray: '#1A1A1A',
          orange: '#FF5F1F', // Signal Orange
          green: '#00FF41', // Matrix Green
        },
      },
      borderRadius: {
        none: '0',
      },
      fontFamily: {
        brutalist: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'IBM Plex Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
