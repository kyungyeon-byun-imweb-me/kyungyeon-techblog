// 사이트 전역 설정. Notion 데이터베이스와 블로그 메타데이터를 이 파일에서 관리합니다.
const CONFIG = {
  // ── 사이트 기본 정보 ──────────────────────────────────────────────────────
  blog: {
    title: "Eric's DevLog (데브로그)",
    // SEO 별칭 — JSON-LD schema:WebSite#alternateName 으로 노출.
    // 사용자가 검색할 만한 표현을 모아둡니다.
    alternateNames: ["Eric's DevLog", "데브로그", "kyungyeon tech blog"],
    description:
      "함께 성장하는 기쁨을 공유하고 싶은, Node.js를 개발하고 공부하는 개발자의 데브로그입니다.",
    author: "변경연",
    language: "ko-KR",
    timezone: "Asia/Seoul",
    siteUrl:
      "https://kyungyeon-byun-imweb-me.github.io/kyungyeon-techblog",
  },

  // ── 브랜드 컬러 ─────────────────────────────────────────────────────────
  // 차분한 흑백 + 강한 포커스 블루.
  brand: {
    primary: "#6366F1",
    primaryDark: "#4F46E5",
    accent: "#6366F1",
    text: "#111827",
    subtext: "#4B5563",
    muted: "#6B7280",
    surface: "#F3F4F6",
    border: "#E5E7EB",
    background: "#FFFFFF",
  },

  // ── Notion 연동 ──────────────────────────────────────────────────────────
  // notion-client (비공식 API). 토큰 불필요. DB 가 "Publish to web" 되어 있어야 함.
  notion: {
    // 공개 저장소에 DB ID 를 남기지 않기 위해 환경변수에서만 읽습니다.
    databaseId: process.env.NOTION_DATABASE_ID || "",
  },

  // ── 네비게이션 ───────────────────────────────────────────────────────────
  // external: true 면 새 탭으로 엽니다(외부 URL).
  nav: [
    { label: "글", href: "/" },
    { label: "태그", href: "/tags" },
    { label: "소개", href: "/about" },
  ],

  // ── 외부 링크 / 푸터 ────────────────────────────────────────────────────
  social: {
    homepage: "https://kyungyeon-byun-imweb-me.github.io/kyungyeon-techblog",
    careers: "",
    contactEmail: "kissob4905@gmail.com",
  },

  // ── 회사 정보 (푸터 노출) ───────────────────────────────────────────────
  company: {
    name: "Eric's DevLog",
    ceo: "변경연",
    privacyOfficer: "",
    businessNumber: "",
    ecommerceNumber: "",
    address: "",
  },

  // ── 분석 (Google Analytics 4) ───────────────────────────────────────────
  // 동의 배너 없이 모든 방문에 대해 gtag 를 로드합니다(전수 집계).
  // 측정 ID 는 GA4 → 관리 → 데이터 스트림에서 발급(`G-XXXXXXXXXX`).
  // enabled: false 면 로드 안 함.
  analytics: {
    enabled: true,
    measurementId: "G-B33T8S3QZH",
  },

  // ── 댓글 (giscus) ───────────────────────────────────────────────────────
  // 1) 레포 Settings → General → Features → Discussions 활성화
  // 2) https://github.com/apps/giscus 설치 (해당 레포에 접근 권한 부여)
  // 3) https://giscus.app 에서 설정 마법사로 repoId / categoryId 받기
  // 4) 아래 값 채우고 enabled: true 로 변경
  comments: {
    giscus: {
      enabled: true,
      repo: "",
      repoId: "",
      category: "General",
      categoryId: "",
      mapping: "pathname", // 페이지 경로를 discussion 과 매핑
      lang: "ko",
      reactionsEnabled: "1",
      inputPosition: "bottom",
    },
  },

  // ── 채용 이벤트 CTA (상단 리본) ──────────────────────────────────────────
  // 이벤트 기간에만 enabled: true. label/href 만 바꿔 운영합니다.
  recruitCTA: {
    enabled: false,
    label: "",
    href: "",
  },

  // ── 메인 페이지 이벤트 팝업 ─────────────────────────────────────────────
  // 개발자 행사 등 홍보용. enabled: false 면 안 뜸. 메인(/)에서만 노출.
  // 사용자가 "오늘 하루 보지 않기" 누르면 24시간 동안 안 보임(localStorage).
  eventPopup: {
    enabled: false,
    image: "",
    badge: "",
    title: "",
    description: "",
    date: "",
    place: "",
    ctaLabel: "",
    ctaHref: "",
  },
}

module.exports = CONFIG
