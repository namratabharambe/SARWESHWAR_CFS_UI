/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // ALWAYS 'class', not 'media'
  content: ['./src/**/*.{html,ts}'],
  important: true, // Overrides Material defaults without inline styles
  theme: {
    // Custom breakpoints — DO NOT change these
    screens: {
      sm: '640px', // Mobile / small handheld
      md: '800px', // Tablet / iPad portrait (NOT default 768px)
      lg: '1370px', // Desktop / dual monitors (NOT default 1024px)
    },
    // Standardized typography scale with line-heights matching application specifications
    fontSize: {
      xs: ['12px', { lineHeight: '1.5' }], // Helper text / metadata (12px, line-height 1.5)
      th: ['13px', { lineHeight: '1.4' }], // Table headers (13px, line-height 1.4)
      sm: ['14px', { lineHeight: '1.5' }], // Table content, body copy (14px, line-height 1.5)
      base: ['14px', { lineHeight: '1.5' }], // Standard body text (14px, line-height 1.5)
      md: ['14px', { lineHeight: '1.4' }], // Form labels, inputs, buttons (14px, line-height 1.4)
      lg: ['16px', { lineHeight: '1.5' }], // Subheadings H4 (16px, line-height 1.5)
      sub: ['16px', { lineHeight: '1.5' }], // Subheading H4 alias
      xl: ['18px', { lineHeight: '1.4' }], // Card heading H3 (18px, line-height 1.4)
      card: ['18px', { lineHeight: '1.4' }], // Card heading H3 alias
      '2xl': ['20px', { lineHeight: '1.4' }], // Section heading H2 (20px, line-height 1.4)
      section: ['20px', { lineHeight: '1.4' }], // Section heading H2 alias
      '3xl': ['24px', { lineHeight: '1.3' }], // Page heading H1 (24px, line-height 1.3)
      page: ['24px', { lineHeight: '1.3' }], // Page heading H1 alias
      '4xl': ['28px', { lineHeight: '1.2' }], // KPI values (28px, line-height 1.2)
      kpi: ['28px', { lineHeight: '1.2' }], // KPI values alias
      '5xl': ['30px', { lineHeight: '1.25' }], // Dashboard hero title (30px, line-height 1.25)
      hero: ['30px', { lineHeight: '1.25' }], // Hero title alias
    },
    extend: {
      colors: {
        'gray-850': '#151f30',
        'gray-750': '#1f2a3e',
        'slate-850': '#131e31',
      },
      width: { 140: '140px' }, // Standardized action buttons & metric pills
      fontFamily: {
        sans: ['Lexend', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
