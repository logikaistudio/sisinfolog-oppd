/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#5D87FF',
        secondary: '#49BEFF',
        success: '#13DEB9',
        warning: '#FFAE1F',
        danger: '#FA896B',
        info: '#539BFF',
        dark: '#2A3547',
        text: '#5A6A85',
        muted: '#2A3547',
        light: '#F4F7FB',
        'light-gray': '#EAEFF4',
        'soft-pink': '#FF8FB1'
      },
      fontFamily: {
        sans: ['Manrope', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
