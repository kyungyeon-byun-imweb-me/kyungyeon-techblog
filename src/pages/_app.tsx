import "react-notion-x/src/styles.css"
import "prismjs/themes/prism-tomorrow.css"
import "katex/dist/katex.min.css"
import "@/styles/globals.css"
import type { AppProps } from "next/app"
import Head from "next/head"
import Analytics from "@/components/common/Analytics"
import { withBasePath } from "@/lib/utils/withBasePath"

const CONFIG = require("../../site.config")

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="theme-color" content={CONFIG.brand.primary} />
        <title>{CONFIG.blog.title}</title>
        <meta name="description" content={CONFIG.blog.description} />
        <link rel="icon" type="image/png" href={withBasePath("/favicon.png")} />
        <link
          rel="alternate"
          type="application/rss+xml"
          href={withBasePath("/feed.xml")}
          title={`${CONFIG.blog.title} RSS`}
        />
        <link
          rel="alternate"
          type="application/atom+xml"
          href={withBasePath("/atom.xml")}
          title={`${CONFIG.blog.title} Atom`}
        />
        <meta property="og:title" content={CONFIG.blog.title} />
        <meta property="og:description" content={CONFIG.blog.description} />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="ko_KR" />
        <meta property="og:site_name" content={CONFIG.blog.title} />
      </Head>
      <Analytics />
      <Component {...pageProps} />
    </>
  )
}
