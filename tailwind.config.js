/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          900: '#060c18',
          800: '#090f20',
          700: '#0d1428',
          600: '#111a33',
          500: '#162040',
        },
        accent: {
          cyan:    '#38bdf8',
          blue:    '#60a5fa',
          purple:  '#a78bfa',
          emerald: '#34d399',
          amber:   '#fbbf24',
          orange:  '#fb923c',
          rose:    '#f87171',
        },
        mode: {
          car:        '#f97316',
          bus:        '#fbbf24',
          subway:     '#38bdf8',
          cycling:    '#4ade80',
          pedestrian: '#c084fc',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow':       'glow 2s ease-in-out infinite',
        'float':      'float 6s ease-in-out infinite',
        'scan':       'scan 4s linear infinite',
      },
      keyframes: {
        glow: {
          '0%, 100%': { opacity: '0.6' },
          '50%':      { opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-4px)' },
        },
        scan: {
          '0%':   { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
