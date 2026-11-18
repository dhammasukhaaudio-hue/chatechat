/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        messenger: '#0084FF',
        telegram: '#229ED9',
        viber: '#7360F2',
        tiktok: '#FE2C55',
      },
      fontFamily: {
        burmese: ['Pyidaungsu', 'Myanmar3', 'Padauk', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
