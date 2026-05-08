/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        // Design system — KZ Audio & Video
        charcoal:       '#0E1012', // Page background — deeper than before
        'slate-surface':'#161A1E', // Cards, nav, footer
        graphite:       '#1E2328', // Hover states, inputs
        gold:           '#C9A84C', // Primary accent
        'gold-light':   '#DDB96A', // Gold hover states
        'warm-white':   '#F2EDE6', // Primary text on dark
        stone:          '#A89F94', // Secondary text
        ash:            '#6B6461', // Muted/placeholder text
        smoke:          '#252A2F', // Borders, dividers
        // Light section override
        'light-bg':     '#F5F2EE',
        'light-surface':'#FFFFFF',
      },
      fontFamily: {
        display: ['"Bodoni Moda"', 'Georgia', '"Times New Roman"', 'serif'],
        sans:    ['"Jost"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
      },
      fontSize: {
        'hero':    ['clamp(3rem,5.5vw,5rem)',        { lineHeight: '1.02', fontWeight: '700' }],
        'h1':      ['clamp(2.25rem,4vw,3.5rem)',      { lineHeight: '1.08', fontWeight: '700' }],
        'h2':      ['clamp(1.8rem,3vw,2.75rem)',      { lineHeight: '1.12', fontWeight: '600' }],
        'h3':      ['1.375rem',                       { lineHeight: '1.3',  fontWeight: '600' }],
        'h4':      ['1.125rem',                       { lineHeight: '1.4',  fontWeight: '600' }],
        'body-lg': ['1.125rem',                       { lineHeight: '1.75', fontWeight: '300' }],
        'body':    ['1rem',                           { lineHeight: '1.75', fontWeight: '400' }],
        'body-sm': ['0.9375rem',                      { lineHeight: '1.6',  fontWeight: '400' }],
        'caption': ['0.8125rem',                      { lineHeight: '1.5',  fontWeight: '500' }],
        'overline':['0.75rem',                        { lineHeight: '1',    fontWeight: '600' }],
      },
      letterSpacing: {
        'hero': '-0.03em',
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
        'card': '8px',
        'btn':  '3px',
      },
      transitionDuration: {
        'fast': '200ms',
        'base': '350ms',
        'slow': '500ms',
      },
    },
  },
  plugins: [],
};
