import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'Times New Roman', 'Georgia', 'serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        paper: '#FBF7EE',
        cream: '#F2ECDF',
        'cream-2': '#EAE2D0',
        ink: '#11161E',
        'ink-2': '#2A2F38',
        navy: '#0E1E36',
        'navy-2': '#14243F',
        muted: '#6A6354',
        'muted-2': '#8A816C',
        gold: '#B88736',
        'gold-2': '#9A6F26',
        line: 'rgba(14,30,54,0.12)',
        'line-2': 'rgba(14,30,54,0.22)',
      },
      maxWidth: {
        page: '1180px',
      },
      letterSpacing: {
        kicker: '0.16em',
      },
    },
  },
  plugins: [],
};

export default config;
