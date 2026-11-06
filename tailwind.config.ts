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
        gold: { DEFAULT: v('gold'), soft: 'color-mix(in srgb, rgb(var(--gold)) 13%, rgb(var(--ink)))' },
      },
      fontFamily: { sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
} satisfies Config
