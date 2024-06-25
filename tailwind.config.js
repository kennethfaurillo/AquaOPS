/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        "piwad-blue": {
          50: "#e0e8f2", 
          100: "#b2c4e0",
          200: "#809cce",
          300: "#4d74bc",
          400: "#2658ac",
          500: "#163A6C",  
          600: "#132e55",
          700: "#0f223e",
          800: "#0a1628",
          900: "#050a13"  
        },
        "piwad-lightblue": {
          50:  "#e0f0ff",
          100: "#b3d8ff",
          200: "#80bbff",
          300: "#4d9eff",
          400: "#1a80ff",
          500: "#4186E5",
          600: "#356bb8",
          700: "#294f8a",
          800: "#1d345c",
          900: "#10192e"
        },
        "piwad-yellow": {
          50:  "#fff8e0",
          100: "#feeeb3",
          200: "#fee480",
          300: "#fdd94d",
          400: "#fccc1a",
          500: "#F2CF40",
          600: "#c2a030",
          700: "#927020",
          800: "#614010",
          900: "#312000"
        },
        "piwad-lightyellow": {
          50:  "#fffbea",
          100: "#fff4cb",
          200: "#ffe99c",
          300: "#ffde6d",
          400: "#ffd43e",
          500: "#FFDE59",
          600: "#ccaf46",
          700: "#997033",
          800: "#664020",
          900: "#332010"
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}