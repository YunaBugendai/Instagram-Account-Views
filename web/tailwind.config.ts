import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#14161F",
        surface: "#1D202C",
        surfaceRaised: "#242838",
        border: "#2A2D3A",
        textPrimary: "#F2F1ED",
        textSecondary: "#8B8D9C",
        textMuted: "#5B5D6B",
        accent: "#E8B04B",
        accentPressed: "#CC9636",
        danger: "#E2685B",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
