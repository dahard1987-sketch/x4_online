import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: "#B0157A",
        "primary-active": "#8E1163",
        "primary-disabled": "#3a1226",
        "primary-subtle": "#fae8f2",
        "canvas-dark": "#0F0E12",
        "surface-card-dark": "#1C1A20",
        "surface-elevated-dark": "#2A2730",
        "canvas-light": "#ffffff",
        "surface-soft-light": "#faf8fa",
        "surface-strong-light": "#f3f0f3",
        "hairline-on-light": "#e8e4ea",
        "hairline-on-dark": "#2A2730",
        ink: "#1A1820",
        "body-on-dark": "#E8E4EA",
        "body-on-light": "#1A1820",
        muted: "#807885",
        "on-primary": "#ffffff",
        correct: "#1E9E6A",
        incorrect: "#D14343",
        info: "#3B82F6",
      },
      fontFamily: {
        sans: [
          "Pretendard",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: ["SF Mono", "Menlo", "Consolas", "monospace"],
      },
      fontSize: {
        hero: ["56px", { lineHeight: "1.1", fontWeight: "700" }],
        "display-lg": ["40px", { lineHeight: "1.15", fontWeight: "700" }],
        "display-md": ["32px", { lineHeight: "1.2", fontWeight: "600" }],
        "title-lg": ["24px", { lineHeight: "1.3", fontWeight: "600" }],
        "title-md": ["20px", { lineHeight: "1.35", fontWeight: "600" }],
        "title-sm": ["16px", { lineHeight: "1.4", fontWeight: "600" }],
        "body-md": ["15px", { lineHeight: "1.6", fontWeight: "400" }],
        "body-sm": ["13px", { lineHeight: "1.5", fontWeight: "400" }],
        button: ["14px", { lineHeight: "1", fontWeight: "600" }],
        "question-body": ["18px", { lineHeight: "1.6", fontWeight: "500" }],
      },
      spacing: {
        xxs: "4px",
        xs: "8px",
        sm: "12px",
        md: "16px",
        lg: "24px",
        xl: "32px",
        xxl: "48px",
        section: "80px",
      },
      borderRadius: {
        sm: "4px",
        md: "6px",
        lg: "8px",
        xl: "12px",
        pill: "9999px",
      },
      maxWidth: {
        page: "1200px",
        learning: "720px",
      },
    },
  },
};

export default config;
