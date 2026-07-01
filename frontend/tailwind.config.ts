import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'rgb(var(--border-rgb) / <alpha-value>)',
        input: 'rgb(var(--border-rgb) / <alpha-value>)',
        ring: 'rgb(var(--primary-rgb) / <alpha-value>)',
        background: 'rgb(var(--background-rgb) / <alpha-value>)',
        foreground: 'rgb(var(--foreground-rgb) / <alpha-value>)',
        surface: {
          DEFAULT: 'rgb(var(--surface-rgb) / <alpha-value>)',
          alt: 'rgb(var(--surface-alt-rgb) / <alpha-value>)',
        },
        primary: {
          DEFAULT: 'rgb(var(--primary-rgb) / <alpha-value>)',
          foreground: 'var(--primary-foreground)',
          strong: 'rgb(var(--primary-strong-rgb) / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'rgb(var(--surface-alt-rgb) / <alpha-value>)',
          foreground: 'rgb(var(--muted-foreground-rgb) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--accent-rgb) / <alpha-value>)',
          foreground: 'rgb(var(--foreground-rgb) / <alpha-value>)',
        },
        popover: {
          DEFAULT: 'rgb(var(--surface-alt-rgb) / <alpha-value>)',
          foreground: 'rgb(var(--foreground-rgb) / <alpha-value>)',
        },
        card: {
          DEFAULT: 'rgb(var(--surface-rgb) / <alpha-value>)',
          foreground: 'rgb(var(--foreground-rgb) / <alpha-value>)',
        },
        severity: {
          critical: 'rgb(var(--critical-rgb) / <alpha-value>)',
          high: 'rgb(var(--high-rgb) / <alpha-value>)',
          medium: 'rgb(var(--medium-rgb) / <alpha-value>)',
          low: 'rgb(var(--low-rgb) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Inter', 'sans-serif'],
        display: ['var(--font-display)', 'Space Grotesk', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
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
        'anomaly-pulse': {
          '0%': { opacity: '0.55', transform: 'scale(0.72)' },
          '100%': { opacity: '0', transform: 'scale(1.9)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'anomaly-pulse': 'anomaly-pulse 600ms ease-out 1',
      },
    },
  },
  plugins: [],
};

export default config;
