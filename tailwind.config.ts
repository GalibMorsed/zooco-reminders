import type { Config } from "tailwindcss";

// NOTE: Replace these hex values with the exact tokens you pull from
// Figma Dev Mode (Inspect panel -> Colors) so the UI matches 1:1.
const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#F5F6F8", // app background (off-white light grey)
        surface: "#FFFFFF", // card / sheet background (white)
        surfaceMuted: "#EBEBEB", // completed card background (light grey)
        accent: "#00C875", // primary vibrant green
        accentMuted: "#E6F7F0", // light green pill background
        border: "#EBEBEB", // subtle border
        textPrimary: "#121212", // dark text
        textSecondary: "#8E8E93", // system grey
        danger: "#FF3B30", // system red
      },
      borderRadius: {
        card: "16px",
        pill: "999px",
        sheet: "24px",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
