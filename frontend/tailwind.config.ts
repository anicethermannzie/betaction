import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '1.5rem',
      screens: { '2xl': '1440px' },
    },
    extend: {
      colors: {
        border:     'hsl(var(--border))',
        input:      'hsl(var(--input))',
        ring:       'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT:    'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT:    'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT:    'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT:    'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT:    'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT:    'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT:    'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },

        // ── Market signal colours ──────────────────────────────────────────
        // Used only where colour carries data meaning: price up / down / hold,
        // home / away / draw, value / no-value. Never decorative.
        up:   { DEFAULT: 'hsl(var(--up))',   soft: 'hsl(var(--up) / 0.12)' },
        down: { DEFAULT: 'hsl(var(--down))', soft: 'hsl(var(--down) / 0.12)' },
        hold: { DEFAULT: 'hsl(var(--hold))', soft: 'hsl(var(--hold) / 0.12)' },
        panel: {
          DEFAULT: 'hsl(var(--panel))',
          raised:  'hsl(var(--panel-raised))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',                       // 4px — data panels
        md: 'calc(var(--radius) - 1px)',           // 3px
        sm: 'calc(var(--radius) - 2px)',           // 2px — chips, ticks
      },
      fontFamily: {
        // Space Grotesk for everything structural; JetBrains Mono for data.
        sans:    ['var(--font-display)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono:    ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      letterSpacing: {
        label: '0.18em',   // uppercase micro-labels
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'live-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.35' },
        },
        'flash-up': {
          '0%':   { backgroundColor: 'hsl(var(--up) / 0.28)' },
          '100%': { backgroundColor: 'transparent' },
        },
        'flash-down': {
          '0%':   { backgroundColor: 'hsl(var(--down) / 0.28)' },
          '100%': { backgroundColor: 'transparent' },
        },
        'ticker': {
          from: { transform: 'translateX(0)' },
          to:   { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up':   'accordion-up 0.2s ease-out',
        'live-pulse':     'live-pulse 1.4s steps(2, jump-none) infinite',
        'flash-up':       'flash-up 0.9s ease-out',
        'flash-down':     'flash-down 0.9s ease-out',
        'ticker':         'ticker 40s linear infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
