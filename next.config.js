/** @type {import('next').NextConfig} */

// GitHub Pages 정적 배포 설정
// - 기본 GitHub Pages 프로젝트 URL 에서는 `/kyungyeon-techblog` basePath 를 사용합니다.
// - kyungyeon.dev 커스텀 도메인을 연결하면 workflow 에서 BASE_PATH="" 로 바꾸면 됩니다.
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
