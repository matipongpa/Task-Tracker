import type { Config } from 'tailwindcss'

export default {
  content: ['./src/renderer/**/*.{html,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: '#6366f1',
      },
    },
  },
  plugins: [],
} satisfies Config
