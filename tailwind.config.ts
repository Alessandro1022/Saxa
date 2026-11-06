import type { Config } from 'tailwindcss'

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0a0a0b',
        card: '#141416',
        line: '#26262a',
        mute: '#8b8b93',
        gold: { DEFAULT: '#d6b46a', soft: '#d6b46a22' },
      },
      fontFamily: { sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'] },
      borderRadius: { '4xl': '2rem' },
    },
  },
  plugins: [],
} satisfies Config
