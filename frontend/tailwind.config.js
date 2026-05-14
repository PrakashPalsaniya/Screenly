/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#7c3aed',
        secondary: '#ec4899',
      },
      fontSize: {
        // Movie Title: 20-22px mobile, 28-32px desktop
        'title-lg': ['clamp(1.25rem, 5vw, 2rem)', { lineHeight: '1.2', fontWeight: '600' }],
        
        // Section Heading: 16-18px mobile, 20-22px desktop
        'title-md': ['clamp(1rem, 4vw, 1.375rem)', { lineHeight: '1.3', fontWeight: '600' }],
        
        // Date / Showtime: 14-15px mobile, 16px desktop
        'body-sm': ['clamp(0.875rem, 2.5vw, 1rem)', { lineHeight: '1.4', fontWeight: '400' }],
        
        // Body / Description: 13-14px mobile, 14-15px desktop
        'body-base': ['clamp(0.8125rem, 2vw, 0.9375rem)', { lineHeight: '1.5', fontWeight: '400' }],
        
        // Seat Labels: 12-13px mobile (stays same on desktop)
        'label-sm': ['clamp(0.75rem, 1.8vw, 0.8125rem)', { lineHeight: '1.4', fontWeight: '500' }],
        
        // Price / Total: 16-18px mobile, 20-24px desktop
        'price': ['clamp(1rem, 4.5vw, 1.5rem)', { lineHeight: '1.3', fontWeight: '700' }],
        
        // CTA Button: 15-16px mobile, 16-18px desktop
        'btn-lg': ['clamp(0.9375rem, 3vw, 1.125rem)', { lineHeight: '1.2', fontWeight: '600' }],
        
        // Legal / Fine Print: 10-11px mobile, 11-12px desktop
        'caption': ['clamp(0.625rem, 1.5vw, 0.75rem)', { lineHeight: '1.3', fontWeight: '400' }],
        
        // Tab / Nav Label: 11-12px mobile, 13-14px desktop
        'nav-label': ['clamp(0.6875rem, 2vw, 0.875rem)', { lineHeight: '1.4', fontWeight: '500' }],
      },
    },
  },
  plugins: [],
}
