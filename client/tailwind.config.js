/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--color-background)",
        surface: "var(--color-surface)",
        primary: "var(--color-primary)",
        inputBg: "var(--color-input-bg)",
        inputBorder: "var(--color-input-border)",
        neonText: "var(--color-neon-text)",
        textSecondary: "var(--color-text-secondary)",
        darkSurface: "var(--color-dark-surface)",
        darkerSurface: "var(--color-darker-surface)",
        almostBlack: "var(--color-almost-black)",
        netflixGray: "#d4d4d4",
        netflixLight: "#e5e5e5",
      },
      fontSize: {
        'micro': ['13px', { lineHeight: '140%', fontWeight: '500' }],
        'body': ['16px', { lineHeight: '150%', fontWeight: '400' }],
        'h4': ['20px', { lineHeight: '140%', fontWeight: '500' }],
        'h3': ['25px', { lineHeight: '135%', fontWeight: '600' }],
        'h2': ['31px', { lineHeight: '130%', fontWeight: '600' }],
        'h1': ['48px', { lineHeight: '125%', fontWeight: '700' }],
        'hero': ['clamp(48px, 6vw, 72px)', { lineHeight: '110%', letterSpacing: '-0.02em', fontWeight: '800' }],
      },
      fontFamily: {
        sans: ['"Inter"', 'sans-serif'],
      },
      maxWidth: {
        'reading': '680px',
        'ultrawide': '1600px',
      },
      borderRadius: {
        'none': '0',
        'sm': '2px',
        DEFAULT: '4px',
        'md': '4px',
        'lg': '6px',
        'xl': '6px',
        '2xl': '8px',
        '3xl': '12px',
        'full': '9999px',
      },
    },
  },
  plugins: [],
}
