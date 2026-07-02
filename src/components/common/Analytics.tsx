import { useEffect } from "react"
import { useRouter } from "next/router"

const CONFIG = require("../../../site.config")

// Google Analytics 4. 초기 gtag 로드는 _document 에서 정적 HTML 에 직접 삽입하고,
// Pages Router 의 클라이언트 라우트 변경만 여기서 추가 집계합니다.

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    dataLayer?: unknown[]
  }
}

export default function Analytics() {
  const router = useRouter()
  const cfg = CONFIG.analytics
  const measurementId = cfg?.measurementId
  const enabled = !!cfg?.enabled && !!measurementId
  const defaultEventParams = cfg?.defaultEventParams

  useEffect(() => {
    if (!enabled || !measurementId) return
    const onRouteChange = (url: string) => {
      window.gtag?.("config", measurementId, {
        page_path: url,
        page_location: window.location.origin + url,
        ...(defaultEventParams || {}),
      })
    }
    router.events.on("routeChangeComplete", onRouteChange)
    return () => {
      router.events.off("routeChangeComplete", onRouteChange)
    }
  }, [defaultEventParams, enabled, measurementId, router.events])

  return null
}
