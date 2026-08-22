/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta principal — IA369 GFactor
        gold: 'var(--color-dourado-joalheria)', // #C8991A — labels, destaques, logo
        wine: 'var(--color-cafe-vinho)',        // #5C1229 — sidebar, botões, fundo
        branco: 'var(--color-branco)',            // #FFFFFF — texto, cards
        cream: 'var(--color-input-bg)',          // #F5EFE6 — fundo dos inputs
      },
      fontFamily: {
        brutalist: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'IBM Plex Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
