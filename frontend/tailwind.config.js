/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          primary: '#0a0a0a',
          secondary: '#111111',
          tertiary: '#1A1A1A',
        },
        gold: {
          DEFAULT: '#a78b71',
          light: '#c9b8a0',
          hover: '#e8d5b7',
          muted: 'rgba(167, 139, 113, 0.15)',
          glow: 'rgba(167, 139, 113, 0.2)',
        },
        accent: {
          DEFAULT: '#a78b71',
          light: '#c9b8a0',
          dark: '#8a7059',
          glow: 'rgba(167, 139, 113, 0.3)',
          muted: 'rgba(167, 139, 113, 0.15)',
        },
        glass: {
          DEFAULT: 'rgba(255, 255, 255, 0.03)',
          light: 'rgba(255, 255, 255, 0.06)',
          border: 'rgba(255, 255, 255, 0.1)',
          hover: 'rgba(255, 255, 255, 0.08)',
        },
        sos: {
          DEFAULT: '#FF4444',
          glow: 'rgba(255, 68, 68, 0.5)',
          dark: '#CC3333',
        },
        severity: {
          low: '#4ADE80',
          medium: '#FBBF24',
          high: '#F97316',
          critical: '#EF4444',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      backdropBlur: {
        xs: '2px',
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
        '4xl': '48px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'float': 'float 6s ease-in-out infinite',
        'sos-pulse': 'sosPulse 1.5s ease-in-out infinite',
        'pulsing-branch': 'pulsingBranch 3s ease-in-out infinite',
        'moveLight': 'moveLight 8s linear infinite',
        'breathe': 'breathe 3s ease-in-out infinite',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(167, 139, 113, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(167, 139, 113, 0.4), 0 0 40px rgba(167, 139, 113, 0.1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        sosPulse: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(255, 68, 68, 0.3)' },
          '50%': { boxShadow: '0 0 30px rgba(255, 68, 68, 0.6), 0 0 60px rgba(255, 68, 68, 0.2)' },
        },
        pulsingBranch: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.7' },
        },
        moveLight: {
          '0%': { transform: 'translateX(-50%) rotate(45deg)' },
          '100%': { transform: 'translateX(50%) rotate(45deg)' },
        },
        breathe: {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
        },
      },
      transitionTimingFunction: {
        'luxury': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
}
