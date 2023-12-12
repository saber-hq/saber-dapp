// @ts-check

const gold = {
  DEFAULT: "#ffdc00",
  600: "#665800",
  700: "#332c00",
};

const brand = {
  DEFAULT: "#6966FB",
  50: "#FFFFFF",
  100: "#FFFFFF",
  200: "#DEDDFE",
  300: "#B7B6FD",
  400: "#908EFC",
  500: "#6966FB",
  550: "#5754da",
  600: "#332FFA",
  700: "#0B06EB",
  800: "#0805B4",
  900: "#06037D",
};

/**
 * @type {import('tailwindcss').Config}
 */
module.exports = {
  content: ["./src/**/*.{html,ts,tsx}"],
  darkMode: "media",
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          "Oxygen-Sans",
          "Ubuntu",
          "Cantarell",
          '"Helvetica Neue"',
          "sans-serif",
        ],
      },
      colors: {
        gold,
        saberGray: {
          primary: "#1a1b20",
          secondary: "#131419",
          tertiary: "#26272b",
          400: "#565861",
        },
        base: { DEFAULT: "#ffffff", 50: "#131419", 100: "#26272b" },
        mono: {
          DEFAULT: "#191919",
          50: "#2e2e2e",
          100: "#464646",
          150: "#5e5e5e",
          200: "#787878",
          250: "#939393",
          300: "#afafaf",
          350: "#464a4f",
          400: "#868f97",
        },
        brand,
        secondary: {
          DEFAULT: "#ffffff",
          50: "#003500",
          100: "#004e00",
          150: "#006917",
          200: "#008431",
          250: "#00a14a",
          300: "#00be64",
          350: "#15dc7f",
          400: "#4cfb9b",
        },
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};
