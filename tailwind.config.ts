import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        primary: '#00f5ff',
        'strict-border': '#2a2a2a',
        'p95-purple': '#a855f7',
        'p50-slate': '#64748b',
        'p99-red': '#ef4444',
        'muted-slate': '#4a5568',
      },
    },
  },
  plugins: [],
}
export default config
