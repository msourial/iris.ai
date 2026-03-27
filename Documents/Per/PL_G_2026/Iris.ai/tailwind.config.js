/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        iris: {
          yellow: "#FFD600",
          black: "#000000",
          white: "#FFFFFF",
          gray: "#1A1A1A",
        },
      },
    },
  },
  plugins: [],
};
