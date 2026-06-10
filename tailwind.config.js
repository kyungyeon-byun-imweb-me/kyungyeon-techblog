/** @type {import('tailwindcss').Config} */
const CONFIG = require("./site.config")

module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1.25rem",
        sm: "1.5rem",
        lg: "2rem",
      },
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1200px",
        "2xl": "1200px",
      },
    },
    extend: {
      colors: {
        // 브랜드는 라이트/다크 공통(가독성 OK)
        brand: {
          DEFAULT: CONFIG.brand.primary,
          dark: CONFIG.brand.primaryDark,
          accent: CONFIG.brand.accent,
        },
        // 시맨틱 색상은 CSS 변수로 → globals.css 의 :root / .dark 에서 값 전환
        ink: {
          900: "var(--color-text)",
          700: "var(--color-subtext)",
          500: "var(--color-muted)",
        },
        surface: "var(--color-surface)",
        line: "var(--color-border)",
        base: "var(--color-bg)", // 페이지 배경
        card: "var(--color-card)", // 카드/입력 등 기존 흰색 표면
      },
      fontFamily: {
        sans: [
          "Pretendard",
          "-apple-system",
          "BlinkMacSystemFont",
          "system-ui",
          "Roboto",
          "Helvetica Neue",
          "Segoe UI",
          "Apple SD Gothic Neo",
          "Noto Sans KR",
          "Malgun Gothic",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "D2Coding",
          "SFMono-Regular",
          "Menlo",
          "Consolas",
          "monospace",
        ],
      },
      fontSize: {
        // 큼직한 디스플레이 타이포 스케일
        display: ["3rem", { lineHeight: "1.2", letterSpacing: "-0.03em", fontWeight: "700" }],
        h1: ["2.25rem", { lineHeight: "1.25", letterSpacing: "-0.025em", fontWeight: "700" }],
        h2: ["1.75rem", { lineHeight: "1.3", letterSpacing: "-0.02em", fontWeight: "700" }],
        h3: ["1.375rem", { lineHeight: "1.4", letterSpacing: "-0.015em", fontWeight: "600" }],
        body: ["1rem", { lineHeight: "1.7", fontWeight: "400" }],
        caption: ["0.875rem", { lineHeight: "1.5", fontWeight: "400" }],
      },
      borderRadius: {
        card: "16px",
        chip: "999px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 16px rgba(15, 23, 42, 0.04)",
        "card-hover":
          "0 1px 2px rgba(15, 23, 42, 0.06), 0 10px 32px rgba(15, 23, 42, 0.08)",
      },
      transitionTimingFunction: {
        // 부드러운 out-easing (ease-smooth 클래스로 사용)
        smooth: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      maxWidth: {
        content: "1200px",
        prose: "768px",
      },
    },
  },
  plugins: [],
}
