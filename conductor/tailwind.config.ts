import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './hooks/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Paleta semántica (lee de globals.css via rgb(var(--*)))
        background: 'rgb(var(--background) / <alpha-value>)',
        foreground: 'rgb(var(--foreground) / <alpha-value>)',
        card: {
          DEFAULT: 'rgb(var(--card) / <alpha-value>)',
          foreground: 'rgb(var(--card-foreground) / <alpha-value>)',
        },
        primary: {
          DEFAULT: 'rgb(var(--primary) / <alpha-value>)',
          foreground: 'rgb(var(--primary-foreground) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'rgb(var(--secondary) / <alpha-value>)',
          foreground: 'rgb(var(--secondary-foreground) / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'rgb(var(--muted) / <alpha-value>)',
          foreground: 'rgb(var(--muted-foreground) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          foreground: 'rgb(var(--accent-foreground) / <alpha-value>)',
        },
        destructive: {
          DEFAULT: 'rgb(var(--destructive) / <alpha-value>)',
          foreground: 'rgb(var(--destructive-foreground) / <alpha-value>)',
        },
        border: 'rgb(var(--border) / <alpha-value>)',
        input: 'rgb(var(--input) / <alpha-value>)',
        ring: 'rgb(var(--ring) / <alpha-value>)',

        // Paleta de marca Yapido (también disponible como utility)
        brand: {
          50:  '#e6fff5',
          100: '#b3ffd9',
          200: '#80ffbf',
          300: '#4dffa5',
          400: '#26ff91',
          500: '#00d97e',
          600: '#00b871',
          700: '#008c52',
          800: '#00663b',
          900: '#003f24',
        },
        moto: '#ff8a3d',
        auto: '#3da6ff',
        ink: {
          50:  '#f6f7fb',
          100: '#eceef5',
          200: '#d2d6e6',
          300: '#a8b0c8',
          400: '#7a85a8',
          500: '#525c80',
          600: '#3a4264',
          700: '#272e4a',
          800: '#191e34',
          900: '#0c1024',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'marker-bounce': 'markerBounce 0.6s ease-out',
        'shimmer': 'shimmer 1.6s linear infinite',
      },
      keyframes: {
        markerBounce: {
          '0%':   { transform: 'translateY(-8px) scale(0.95)', opacity: '0' },
          '60%':  { transform: 'translateY(2px) scale(1.02)', opacity: '1' },
          '100%': { transform: 'translateY(0) scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
