/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#00adef',    // GOG Logo Primary Electric Cyan
          600: '#0090cc',
          700: '#006eb9',    // GOG Logo Midtone Azure
          800: '#005291',    // GOG Logo Deep Royal Cobalt
          900: '#003766',
          950: '#002142',
        },
        gog: {
          cyan: '#00adef',       // Primary vibrant cyan from logo
          azure: '#006eb9',      // Midtone rich blue from logo
          royal: '#005291',      // Deep royal cobalt from logo
          navy: '#003766',       // Deep corporate navy
          midnight: '#07152b',   // Dark midnight slate
          dark: '#060d19',       // Obsidian background
          card: '#0c1a30',       // Surface card background
          cardHover: '#112544',  // Elevated card hover
          border: '#173054',     // Subdued navy border
          borderLight: '#234676',// Active border highlight
          accent: '#00adef',     // Primary accent
          text: '#f8fafc',       // Crisp white text
          muted: '#94a3b8',      // Slate muted text
        }
      },
    },
  },
  plugins: [],
};
