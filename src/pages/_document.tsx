import { Html, Head, Main, NextScript } from "next/document"

const CONFIG = require("../../site.config")

const analytics = CONFIG.analytics
const analyticsMeasurementId = analytics?.measurementId || ""
const analyticsEnabled = !!analytics?.enabled && !!analyticsMeasurementId
const analyticsMeasurementIdJson = JSON.stringify(analyticsMeasurementId).replace(/</g, "\\u003c")
const analyticsDefaultEventParams = JSON.stringify(
  analytics?.defaultEventParams || {}
).replace(/</g, "\\u003c")

export default function Document() {
  return (
    <Html lang="ko">
      <Head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        {analyticsEnabled && (
          <>
            <link rel="preconnect" href="https://www.googletagmanager.com" />
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(
                analyticsMeasurementId
              )}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  window.gtag = window.gtag || function gtag(){window.dataLayer.push(arguments);};
                  window.gtag('js', new Date());
                  window.gtag('config', ${analyticsMeasurementIdJson}, Object.assign(
                    { anonymize_ip: true },
                    ${analyticsDefaultEventParams}
                  ));
                `,
              }}
            />
          </>
        )}
        {/* FOUC 방지: 페인트 전에 테마를 <html> 에 반영. 기본은 라이트,
            사용자가 토글로 'dark' 를 선택해 저장한 경우에만 다크로 시작 */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{document.documentElement.classList.toggle('dark',localStorage.getItem('theme')==='dark');}catch(_){}})();",
          }}
        />
      </Head>
      <body className="bg-base text-ink-900 antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
