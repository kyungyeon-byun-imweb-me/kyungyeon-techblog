import { Html, Head, Main, NextScript } from "next/document"

export default function Document() {
  return (
    <Html lang="ko">
      <Head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
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
