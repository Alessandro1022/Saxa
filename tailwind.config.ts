import type { Config } from 'tailwindcss'

const v = (name: string) => `rgb(var(--${name}) / <alpha-value>)`

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: v('ink'),
        card: v('card'),
        line: v('line'),
        mute: v('mute'),
        fg: v('fg'),
        ongold: '#0a0a0b',
        gold: { DEFAULT: v('gold'), soft: 'rgb(var(--gold) / 0.13)' },
      },
      fontFamily: { sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'] },
      borderRadius: { '4xl': '2rem' },
    },
  },
  plugins: [],
} satisfies Config
