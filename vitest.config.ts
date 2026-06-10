import { defineConfig } from "vitest/config"
import { resolve } from "node:path"

// 단위 테스트용 설정. 노션 파싱/스냅샷 변환 같은 순수 로직만 대상으로 하므로
// jsdom 등 브라우저 환경 없이 node 에서 빠르게 실행합니다.
export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
      "site.config": resolve(__dirname, "site.config.js"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
})
