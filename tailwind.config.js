/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',          // ALWAYS 'class', not 'media'
  content: ['./src/**/*.{html,ts}'],
  important: true,            // Overrides Material defaults without inline styles
  theme: {
    // Custom breakpoints — DO NOT change these
    screens: {
      sm: '640px',    // Mobile / small handheld
      md: '800px',    // Tablet / iPad portrait (NOT default 768px)
      lg: '1370px',   // Desktop / dual monitors (NOT default 1024px)
    },
    // Custom font scale — DO NOT use default Tailwind sizes
    fontSize: {
      xs:    '10px',       // Micro labels, badge counts
      sm:    '12px',       // Secondary metadata, table sub-text
      md:    '14px',       // Standard body text, form labels
      base:  '16px',       // Primary body copy
      xl:    '1.25rem',    // Section headers
      '2xl': '1.563rem',   // Card & modal headers
      '3xl': '1.953rem',   // Feature page headers
      '4xl': '2.441rem',   // Large metric numbers
      '5xl': '3.052rem',   // Hero dashboard KPIs
    },
    extend: {
      width: { 140: '140px' }, // Standardized action buttons & metric pills
      fontFamily: {
        sans: ['Lexend', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
