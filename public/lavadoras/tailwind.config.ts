
import type {Config} from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        body: ['Inter', 'sans-serif'],
        headline: ['Inter', 'sans-serif'],
        code: ['monospace'],
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
        /* Cyber-Luxe Extended Palette */
        cyber: {
          violet: 'hsl(250 85% 65%)',
          emerald: 'hsl(165 82% 51%)',
          rose: 'hsl(330 90% 65%)',
          amber: 'hsl(38 92% 60%)',
          depth: 'hsl(222 47% 6%)',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        'glow-sm': '0 0 15px hsl(250 85% 65% / 0.2)',
        'glow-md': '0 0 30px hsl(250 85% 65% / 0.3)',
        'glow-lg': '0 0 60px hsl(250 85% 65% / 0.2), 0 0 120px hsl(250 85% 65% / 0.1)',
        'glow-emerald': '0 0 30px hsl(165 82% 51% / 0.3)',
        'glow-rose': '0 0 30px hsl(330 90% 65% / 0.3)',
        'depth-sm': '0 2px 8px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04)',
        'depth-md': '0 4px 16px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.06)',
        'depth-lg': '0 8px 32px rgba(0,0,0,0.16), 0 4px 12px rgba(0,0,0,0.08)',
        'depth-xl': '0 16px 64px rgba(0,0,0,0.2), 0 8px 24px rgba(0,0,0,0.1)',
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
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-8px) rotate(2deg)' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.05)' },
        },
        'spotlight': {
          '0%': { opacity: '0', transform: 'translate(-50%, -50%) scale(0.8)' },
          '100%': { opacity: '1', transform: 'translate(-50%, -50%) scale(1)' },
        },
        'text-reveal': {
          '0%': { opacity: '0', transform: 'translateY(20px)', filter: 'blur(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)', filter: 'blur(0)' },
        },
        'border-dance': {
          '0%, 100%': { borderColor: 'hsl(250 85% 65% / 0.3)' },
          '33%': { borderColor: 'hsl(165 82% 51% / 0.3)' },
          '66%': { borderColor: 'hsl(330 90% 65% / 0.3)' },
        },
        'breathe': {
          '0%, 100%': { boxShadow: '0 0 0 0 hsl(250 85% 65% / 0)' },
          '50%': { boxShadow: '0 0 30px 8px hsl(250 85% 65% / 0.3)' },
        },
        'slide-up-fade': {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'morph': {
          '0%, 100%': { borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%' },
          '25%': { borderRadius: '30% 60% 70% 40% / 50% 60% 30% 60%' },
          '50%': { borderRadius: '50% 60% 40% 60% / 30% 70% 60% 40%' },
          '75%': { borderRadius: '40% 60% 60% 40% / 60% 40% 40% 60%' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'float': 'float 6s cubic-bezier(0.45, 0, 0.15, 1) infinite',
        'float-slow': 'float-slow 8s cubic-bezier(0.45, 0, 0.15, 1) infinite',
        'glow-pulse': 'glow-pulse 3s cubic-bezier(0.45, 0, 0.15, 1) infinite',
        'spotlight': 'spotlight 1s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'text-reveal': 'text-reveal 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'border-dance': 'border-dance 6s ease-in-out infinite',
        'breathe': 'breathe 4s ease-in-out infinite',
        'slide-up-fade': 'slide-up-fade 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-in': 'scale-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'morph': 'morph 15s ease-in-out infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
