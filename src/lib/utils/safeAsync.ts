// 정적 생성(getStaticProps / getStaticPaths) 에서 노션 API 가 영구 실패해도
// 사이트 자체가 죽지 않도록 graceful fallback 을 적용하는 헬퍼.
//
// 사용 예:
//   const props = await safeAsync(() => fetchHomeProps(), { posts: [], ... }, "home")
//
// 실패 시 console.error 로 흔적을 남겨 Actions / 로컬 콘솔에서 추적 가능.

export const safeAsync = async <T>(
  fn: () => Promise<T>,
  fallback: T,
  label: string
): Promise<T> => {
  try {
    return await fn()
  } catch (err) {
    console.error(`[${label}] 노션 fetch 실패 — fallback 으로 진행:`, err)
    return fallback
  }
}
