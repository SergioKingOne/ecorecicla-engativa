/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Primary green (contrast ≥ 4.5:1 over white for text usage)
        primary: {
          DEFAULT: '#2E7D32',
          dark: '#1B5E20',
          light: '#E8F5E9',
        },
        // National color code for bags (Resolución 2184 de 2019).
        // Color is NEVER the only channel: always accompanied by text (WCAG 1.4.1).
        bag: {
          white: '#F5F5F5',
          green: '#43A047',
          black: '#212121',
        },
      },
    },
  },
  plugins: [],
};
