import Head from "next/head"
import type { TPost } from "@/types"

const CONFIG = require("../../../site.config")

const SITE_URL = CONFIG.blog.siteUrl.replace(/\/$/, "")
const DEFAULT_IMAGE_PATH = "/thumb/default.png"

const isAbsoluteUrl = (url: string): boolean =>
  url.startsWith("http://") || url.startsWith("https://")

export const buildSiteUrl = (path = "/"): string => {
  if (isAbsoluteUrl(path)) return path
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  return `${SITE_URL}${normalizedPath}`
}

export const buildPostUrl = (slug: string): string =>
  buildSiteUrl(`/posts/${encodeURIComponent(slug)}/`)

export const buildImageUrl = (image?: string | null): string => {
  if (image && isAbsoluteUrl(image)) return image
  return buildSiteUrl(image || DEFAULT_IMAGE_PATH)
}

const toJsonLd = (data: Record<string, unknown>): string =>
  JSON.stringify(data).replace(/</g, "\\u003c")

type SeoProps = {
  title?: string
  description?: string
  path?: string
  image?: string | null
  type?: "website" | "article"
  keywords?: string[]
  noindex?: boolean
  post?: TPost
}

export default function Seo({
  title,
  description = CONFIG.blog.description,
  path = "/",
  image,
  type = "website",
  keywords = [],
  noindex = false,
  post,
}: SeoProps) {
  const pageTitle = title ? `${title} | ${CONFIG.blog.title}` : CONFIG.blog.title
  const canonicalUrl = buildSiteUrl(path)
  const imageUrl = buildImageUrl(image)
  const authors = post
    ? post.authors.length > 0
      ? post.authors.map((author) => author.name)
      : [CONFIG.blog.author]
    : []
  const allKeywords = Array.from(
    new Set([...(post?.category || []), ...(post?.tags || []), ...keywords])
  )
  const jsonLd = post
    ? {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: post.title,
        description,
        image: imageUrl,
        url: canonicalUrl,
        datePublished: post.date || undefined,
        dateModified: post.date || undefined,
        author: authors.map((name) => ({ "@type": "Person", name })),
        publisher: {
          "@type": "Person",
          name: CONFIG.blog.author,
        },
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": canonicalUrl,
        },
        keywords: allKeywords.length > 0 ? allKeywords.join(", ") : undefined,
      }
    : {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: CONFIG.blog.title,
        alternateName: CONFIG.blog.alternateNames,
        description: CONFIG.blog.description,
        url: SITE_URL,
        inLanguage: CONFIG.blog.language,
      }

  return (
    <Head>
      <title>{pageTitle}</title>
      <meta key="description" name="description" content={description} />
      {noindex && <meta key="robots" name="robots" content="noindex,follow" />}
      <link key="canonical" rel="canonical" href={canonicalUrl} />

      <meta key="og:title" property="og:title" content={pageTitle} />
      <meta key="og:description" property="og:description" content={description} />
      <meta key="og:type" property="og:type" content={type} />
      <meta key="og:url" property="og:url" content={canonicalUrl} />
      <meta key="og:image" property="og:image" content={imageUrl} />
      <meta key="og:locale" property="og:locale" content="ko_KR" />
      <meta key="og:site_name" property="og:site_name" content={CONFIG.blog.title} />

      <meta key="twitter:card" name="twitter:card" content="summary_large_image" />
      <meta key="twitter:creator" name="twitter:creator" content={CONFIG.blog.author} />
      <meta key="twitter:title" name="twitter:title" content={pageTitle} />
      <meta key="twitter:description" name="twitter:description" content={description} />
      <meta key="twitter:image" name="twitter:image" content={imageUrl} />

      {allKeywords.length > 0 && (
        <meta key="keywords" name="keywords" content={allKeywords.join(", ")} />
      )}
      {post?.date && (
        <meta
          key="article:published_time"
          property="article:published_time"
          content={post.date}
        />
      )}
      {post?.date && (
        <meta
          key="article:modified_time"
          property="article:modified_time"
          content={post.date}
        />
      )}
      {post?.category.map((category) => (
        <meta key={`article-section-${category}`} property="article:section" content={category} />
      ))}
      {post?.tags.map((tag) => (
        <meta key={`article-tag-${tag}`} property="article:tag" content={tag} />
      ))}
      {authors.map((author) => (
        <meta key={`article-author-${author}`} property="article:author" content={author} />
      ))}

      <script
        key="schema-org-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLd(jsonLd) }}
      />
    </Head>
  )
}
