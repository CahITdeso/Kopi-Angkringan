import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        angkringan: {
          primary: '#8B4513',
          secondary: '#D2691E',
          dark: '#1a0e05',
          warm: '#2C1810',
          light: '#FFF3E0',
          accent: '#FF8C00',
          gold: '#D4A574',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
export default config