// GitHub Pages 프로젝트 사이트에서 basePath 가 붙는 경우
// 모든 정적 자산 경로 앞에 해당 basePath 를 붙입니다.
// next.config.js 에서 NEXT_PUBLIC_BASE_PATH 를 노출하므로 이를 활용합니다.
const BASE = process.env.NEXT_PUBLIC_BASE_PATH || ""

export const withBasePath = (path: string): string => {
  if (!path) return BASE || "/"
  if (path.startsWith("http://") || path.startsWith("https://")) return path
  if (!BASE) return path
  return `${BASE}${path.startsWith("/") ? "" : "/"}${path}`
}
