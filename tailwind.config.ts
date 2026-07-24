import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue',
    './error.vue',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        body: ['DM Sans', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Core brand
        forest: {
          50:  '#f0f7f5',
          100: '#d9ede9',
          200: '#b3dbd3',
          300: '#7fc2b6',
          400: '#4fa396',
          500: '#4A7C6F', // primary
          600: '#3a6258',
          700: '#2e4f47',
          800: '#243d37',
          900: '#1a2d29',
          950: '#0d1f1c',
        },
        // Warm brown accent
        clay: {
          50:  '#faf6f3',
          100: '#f2e9e2',
          200: '#e4d0c2',
          300: '#d1b09a',
          400: '#bc8e72',
          500: '#8B6F5E', // secondary
          600: '#7a5e4f',
          700: '#634c3f',
          800: '#4f3c33',
          900: '#3d2f28',
        },
        // Terracotta accent
        terra: {
          300: '#f0c4a0',
          400: '#e8a87c', // accent
          500: '#de8f5a',
          600: '#c97640',
        },
        // Neutral warm grays
        warm: {
          50:  '#F7F5F2', // light bg
          100: '#EDEAE5',
          200: '#D8D3CB',
          300: '#B8B0A5',
          400: '#948D82',
          500: '#716A60',
          600: '#575049',
          700: '#3E3935',
          800: '#292521',
          900: '#1A1714',
          950: '#0E0C0A',
        },
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        'soft': '0 2px 20px 0 rgba(74, 124, 111, 0.08)',
        'card': '0 4px 24px 0 rgba(26, 23, 20, 0.06)',
        'elevated': '0 8px 40px 0 rgba(26, 23, 20, 0.12)',
        'glow': '0 0 30px 0 rgba(74, 124, 111, 0.2)',
      },
      backgroundImage: {
        'gradient-serenity': 'linear-gradient(135deg, #4A7C6F 0%, #3a6258 100%)',
        'gradient-warm': 'linear-gradient(135deg, #8B6F5E 0%, #7a5e4f 100%)',
        'gradient-terra': 'linear-gradient(135deg, #e8a87c 0%, #de8f5a 100%)',
      },
      animation: {
        'fade-up': 'fadeUp 0.5s ease forwards',
        'fade-in': 'fadeIn 0.3s ease forwards',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(32px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.7', transform: 'scale(0.97)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config
