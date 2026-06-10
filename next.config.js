/** @type {import('next').NextConfig} */

// GitHub Pages 정적 배포 설정
// - 커스텀 도메인이 붙어 있으면 workflow 의 configure-pages 가 BASE_PATH="" 를 주입합니다.
//   workflow 의 `configure-pages` 가 그 사실을 감지하고 BASE_PATH 를 ""로 주입합니다.
// - 프로젝트 페이지 (`<owner>.github.io/<repo>`) 로 떨어지는 경우만 `/kyungyeon-techblog` 폴백.
// - `??` 를 쓰는 이유: `||` 로 두면 빈 문자열도 falsy 라 폴백이 잘못 발동해 자산이 깨집니다.
const isGithubPages = process.env.GITHUB_PAGES === "true"
const basePath = isGithubPages ? (process.env.BASE_PATH ?? "/kyungyeon-techblog") : ""

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: "export",
  trailingSlash: true,
  // next/image 를 사용하지 않으므로 unoptimized true 만 켜두면 충분.
  // (remotePatterns 는 next/image 최적화에만 사용되므로 불필요)
  images: { unoptimized: true },
  basePath,
  assetPrefix: basePath ? `${basePath}/` : undefined,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  experimental: {
    scrollRestoration: true,
  },
}

module.exports = nextConfig
