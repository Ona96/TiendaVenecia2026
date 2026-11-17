import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ivory: '#FAF9F6',
        charcoal: {
          DEFAULT: '#1A1A1A',
          soft: '#2C2C2C',
          muted: '#555555',
        },
        gold: {
          DEFAULT: '#C5A059',
          light: '#DCC08C',
          dark: '#A9853F',
        },
        line: '#E8E4DC',
        /* Colores semánticos de estado (Fase 2): tono atelier, no SaaS genérico. */
        success: {
          DEFAULT: '#4A6741',
          soft: '#EEF2EC',
        },
        error: {
          DEFAULT: '#9B3B3B',
          soft: '#F7ECEC',
        },
        warn: {
          DEFAULT: '#A67B2E',
          soft: '#F7F1E4',
        },
      },
      fontFamily: {
        display: ['var(--font-playfair)', 'Georgia', 'serif'],
        sans: ['var(--font-jost)', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        luxe: '0.32em',
      },
      boxShadow: {
        luxe: '0 24px 60px -24px rgba(26, 26, 26, 0.22)',
        card: '0 10px 40px -18px rgba(26, 26, 26, 0.18)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(18px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.8s ease both',
      },
    },
  },
  plugins: [],
};

export default config;
