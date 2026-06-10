import { useEffect } from "react"
import Script from "next/script"
import { useRouter } from "next/router"

const CONFIG = require("../../../site.config")

// Google Analytics 4. 동의 배너 없이 모든 방문에 대해 gtag 를 로드합니다.
// Pages Router 의 라우트 변경 이벤트마다 page_view 를 수동으로 보냅니다
// (자동 페이지뷰는 첫 로드만 잡히므로).

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    dataLayer?: unknown[]
  }
}

export default function Analytics() {
  const router = useRouter()
  const cfg = CONFIG.analytics
  const enabled = !!cfg?.enabled && !!cfg?.measurementId
  const defaultEventParams = cfg?.defaultEventParams

  useEffect(() => {
    if (!enabled) return
    const onRouteChange = (url: string) => {
      window.gtag?.("event", "page_view", {
        page_path: url,
        page_location: window.location.origin + url,
        ...(defaultEventParams || {}),
      })
    }
    router.events.on("routeChangeComplete", onRouteChange)
    return () => {
      router.events.off("routeChangeComplete", onRouteChange)
    }
  }, [defaultEventParams, enabled, router.events])

  if (!enabled) return null

  const id = cfg.measurementId
  const defaultEventParamsJson = JSON.stringify(defaultEventParams || {})

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          const defaultEventParams = ${defaultEventParamsJson};
          function gtag(){window.dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${id}', {
            anonymize_ip: true,
            send_page_view: true,
            ...defaultEventParams,
          });
        `}
      </Script>
    </>
  )
}
