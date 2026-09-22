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
    // Enhanced font scale for crisp legibility and comfort
    fontSize: {
      xs:    '12px',       // Micro labels, badge counts, small metadata
      sm:    '13.5px',     // Secondary metadata, table text, hints
      md:    '15px',       // Standard body text, form labels, inputs
      base:  '16px',       // Primary body copy
      lg:    '18px',       // Subheadings, medium KPI labels
      xl:    '1.25rem',    // Section headers (20px)
      '2xl': '1.563rem',   // Card & modal headers (25px)
      '3xl': '1.953rem',   // Feature page headers (31px)
      '4xl': '2.441rem',   // Large metric numbers (39px)
      '5xl': '3.052rem',   // Hero dashboard KPIs (48px)
    },
    extend: {
      colors: {
        'gray-750': '#1e293b',
        'gray-850': '#111a2d',
        'slate-850': '#111a2d',
        'cfs-primary': '#2563EB',
        'cfs-primary-hover': '#1D4ED8',
        'cfs-primary-focus': '#3B82F6',
        'cfs-sidebar': '#0F172A',
        'cfs-sidebar-hover': '#1E293B',
        'cfs-bg': '#F8FAFC',
        'cfs-card': '#FFFFFF',
        'cfs-text-primary': '#1E293B',
        'cfs-text-heading': '#0F172A',
        'cfs-text-secondary': '#64748B',
        'cfs-border': '#E2E8F0',
        'cfs-teal': '#0D9488',
      },
      width: { 140: '140px' }, // Standardized action buttons & metric pills
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
