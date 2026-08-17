/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: 'var(--color-dourado-joalheria)',
        wine: 'var(--color-cafe-vinho)',
        branco: 'var(--color-branco)',
        matrix: {
          black: 'var(--color-cafe-vinho)', // fallback mapping
          gray: 'var(--color-cafe-vinho)',  // fallback mapping
          orange: 'var(--color-dourado-joalheria)', // fallback mapping
          green: 'var(--color-branco)', // fallback mapping
        },
      },
      fontFamily: {
        brutalist: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'IBM Plex Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
