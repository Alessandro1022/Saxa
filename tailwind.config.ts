import type { Config } from 'tailwindcss'

const v = (name: string) => `rgb(var(--${name}) / <alpha-value>)`

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: v('ink'),
        card: v('card'),
        mute: v('mute'),
        fg: v('fg'),
        ongold: '#141109',
        gold: { DEFAULT: v('gold'), soft: 'rgb(var(--gold) / 0.12)' },
      },
      fontFamily: { sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
} satisfies Config
