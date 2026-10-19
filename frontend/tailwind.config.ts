import type { Config } from 'tailwindcss';

/**
 * ApexCross Design System — Tailwind token mapping.
 * Source of truth: frontend/DESIGN_SYSTEM.md
 * Components MUST use these token names. Zero raw hex values in JSX.
 */
const config: Config = {
  darkMode: 'class',
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        /* --- Base layers --- */
        abyss: '#07191E',
        deep: '#0A1628',
        surface: '#0F172A',
        elevated: '#1E293B',

        /* --- Accents --- */
        mint: {
          DEFAULT: '#02F5A1',
          soft: 'rgba(2, 245, 161, 0.12)',
          border: 'rgba(2, 245, 161, 0.20)',
        },
        cobalt: {
          DEFAULT: '#0284C7',
          soft: 'rgba(2, 132, 199, 0.12)',
        },

        /* --- Semantic --- */
        success: {
          DEFAULT: '#059669',
          soft: 'rgba(5, 150, 105, 0.12)',
        },
        warning: {
          DEFAULT: '#D97706',
          soft: 'rgba(217, 119, 6, 0.12)',
        },
        danger: {
          DEFAULT: '#DC2626',
          soft: 'rgba(220, 38, 38, 0.12)',
        },

        /* --- Text --- */
        'text-primary': '#F1F5F9',
        'text-secondary': '#94A3B8',
        'text-muted': '#64748B',
        'text-on-accent': '#07191E',

        /* --- Glass --- */
        glass: {
          DEFAULT: 'rgba(15, 23, 42, 0.60)',
          modal: 'rgba(7, 25, 30, 0.85)',
          inline: 'rgba(30, 41, 59, 0.70)',
        },
      },

      borderColor: {
        glass: 'rgba(255, 255, 255, 0.08)',
        'glass-strong': 'rgba(255, 255, 255, 0.12)',
        'glass-mint': 'rgba(2, 245, 161, 0.20)',
      },

      /* --- STRICT 3-value radius system --- */
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
      },

      /* --- Layered shadow system (never single-layer) --- */
      boxShadow: {
        xs: '0 1px 2px rgba(0, 0, 0, 0.25)',
        sm: '0 1px 2px rgba(0, 0, 0, 0.30), 0 2px 8px rgba(0, 0, 0, 0.20)',
        md: '0 1px 2px rgba(0, 0, 0, 0.30), 0 4px 16px rgba(0, 0, 0, 0.25), 0 12px 40px rgba(0, 0, 0, 0.15)',
        lg: '0 2px 4px rgba(0, 0, 0, 0.35), 0 8px 24px rgba(0, 0, 0, 0.30), 0 24px 80px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(2, 245, 161, 0.08)',
        'glow-mint': '0 0 20px rgba(2, 245, 161, 0.12), 0 0 60px rgba(2, 245, 161, 0.06)',
        'glow-danger': '0 0 20px rgba(220, 38, 38, 0.15), 0 0 60px rgba(220, 38, 38, 0.08)',
        'inset-sheen': 'inset 0 1px 0 rgba(255, 255, 255, 0.06)',
      },

      /* --- Typography --- */
      fontFamily: {
        display: ['"Abril Fatface"', 'Georgia', 'serif'],
        sans: ['Archivo', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },

      fontSize: {
        display: ['48px', { lineHeight: '1.10', letterSpacing: '-0.02em' }],
        h1: ['32px', { lineHeight: '1.20', letterSpacing: '-0.01em' }],
        h2: ['24px', { lineHeight: '1.30', letterSpacing: '-0.005em' }],
        h3: ['20px', { lineHeight: '1.40' }],
        h4: ['16px', { lineHeight: '1.50', letterSpacing: '0.01em' }],
        body: ['15px', { lineHeight: '1.60' }],
        small: ['13px', { lineHeight: '1.50' }],
        caption: ['11px', { lineHeight: '1.40', letterSpacing: '0.05em' }],
        mono: ['13px', { lineHeight: '1.50' }],
        'mono-sm': ['11px', { lineHeight: '1.40', letterSpacing: '0.02em' }],
      },

      /* --- Motion --- */
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.22, 1, 0.36, 1)',
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },

      transitionDuration: {
        250: '250ms',
        400: '400ms',
        600: '600ms',
        800: '800ms',
      },

      /* --- Layout --- */
      maxWidth: {
        content: '1200px',
        chat: '760px',
        modal: '480px',
        receipt: '640px',
      },

      spacing: {
        header: '56px',
        120: '120px',
      },

      /* --- Animations --- */
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95) translateY(8px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        'badge-pop': {
          '0%': { opacity: '0', transform: 'scale(0.8)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'signal-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.45' },
        },
        'bar-fill': {
          '0%': { width: '0%' },
        },
      },

      animation: {
        'fade-up': 'fade-up 400ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in': 'fade-in 250ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'scale-in': 'scale-in 300ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'badge-pop': 'badge-pop 200ms cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'signal-pulse': 'signal-pulse 3s ease-in-out infinite',
        'bar-fill': 'bar-fill 800ms cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
  plugins: [],
};

export default config;
