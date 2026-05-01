/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        // Design system — KZ Audio & Video
        charcoal:       '#121416', // Page background
        'slate-surface':'#1C1F23', // Cards, nav, footer
        graphite:       '#252A2F', // Hover states, inputs
        gold:           '#C9A84C', // Primary accent
        'gold-light':   '#E2C47A', // Gold hover states
        'warm-white':   '#F2EDE6', // Primary text on dark
        stone:          '#A89F94', // Secondary text
        ash:            '#6B6461', // Muted/placeholder text
        smoke:          '#2E3338', // Borders, dividers
        // Light section override
        'light-bg':     '#F5F2EE',
        'light-surface':'#FFFFFF',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', '"Times New Roman"', 'serif'],
        sans:    ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
      },
      fontSize: {
        'hero':    ['3.5rem',  { lineHeight: '1.1',  fontWeight: '700' }],
        'h1':      ['2.75rem', { lineHeight: '1.15', fontWeight: '700' }],
        'h2':      ['2rem',    { lineHeight: '1.2',  fontWeight: '600' }],
        'h3':      ['1.375rem',{ lineHeight: '1.3',  fontWeight: '600' }],
        'h4':      ['1.125rem',{ lineHeight: '1.4',  fontWeight: '600' }],
        'body-lg': ['1.125rem',{ lineHeight: '1.7',  fontWeight: '400' }],
        'body':    ['1rem',    { lineHeight: '1.7',  fontWeight: '400' }],
        'body-sm': ['0.9375rem',{lineHeight: '1.6',  fontWeight: '400' }],
        'caption': ['0.8125rem',{lineHeight: '1.5',  fontWeight: '500' }],
        'overline':['0.8125rem',{lineHeight: '1',    fontWeight: '600' }],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      maxWidth: {
        'content': '768px',
        'main':    '1120px',
        'wide':    '1280px',
      },
      borderRadius: {
        'card': '6px',
        'btn':  '4px',
      },
      transitionDuration: {
        'fast': '250ms',
        'base': '300ms',
      },
    },
  },
  plugins: [],
};
