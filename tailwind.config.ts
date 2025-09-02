
import type { Config } from "tailwindcss";

export default {
  important: true,
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0A0F1F",
        ink2: "#0B1224",
        card: "#0E1A33",
        cardAlt: "#202A49",
        primary: "#5B22D6",
        primaryHover: "#6C2BD9",
        success: "#2CCB5A",
        accent: "#C9A9FF",
        cyan: "#2EC6D3",
      },
      boxShadow: {
        greenGlow: "0 14px 40px rgba(44,203,90,0.35)",
        card: "0 22px 60px rgba(0,0,0,0.5)",
        soft: "0 14px 40px rgba(0,0,0,0.35)",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "Segoe UI", "Roboto", "Helvetica Neue", "Arial"],
      },
      borderRadius: { xl2: "1rem" },
    },
  },
  plugins: [],
} satisfies Config;
