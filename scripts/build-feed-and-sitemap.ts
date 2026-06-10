// 빌드 산출물(./out)에 RSS(feed.xml), Atom(atom.xml), sitemap.xml 을 생성합니다.
// package.json 의 `postbuild` 훅에서 자동 실행됨.

import { mkdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { Feed } from "feed"

const { loadLocalEnv } = require("./load-env.cjs")
loadLocalEnv(process.cwd())

const { getPosts } = require("../src/lib/notion/getPosts") as typeof import(
  "../src/lib/notion/getPosts"
)
const CONFIG = require("../site.config")

const OUT_DIR = process.env.OUT_DIR || "out"
const SITE_URL: string = CONFIG.blog.siteUrl.replace(/\/$/, "")
const RSS_ITEM_LIMIT = 20

const postUrl = (slug: string) => `${SITE_URL}/posts/${encodeURIComponent(slug)}/`

async function buildRss(posts: Awaited<ReturnType<typeof getPosts>>) {
  const feed = new Feed({
    title: CONFIG.blog.title,
    description: CONFIG.blog.description,
    id: SITE_URL + "/",
    link: SITE_URL + "/",
    language: CONFIG.blog.language || "ko-KR",
    copyright: `© ${new Date().getFullYear()} ${CONFIG.blog.author}`,
    feedLinks: {
      rss: `${SITE_URL}/feed.xml`,
      atom: `${SITE_URL}/atom.xml`,
    },
    author: { name: CONFIG.blog.author || CONFIG.blog.title },
  })

  for (const p of posts.slice(0, RSS_ITEM_LIMIT)) {
    const url = postUrl(p.slug)
    feed.addItem({
      title: p.title,
      id: url,
      link: url,
      description: p.summary || undefined,
      date: p.date ? new Date(p.date) : new Date(),
      category:
        p.category.length > 0 ? p.category.map((c) => ({ name: c })) : undefined,
      author:
        p.authors.length > 0
          ? p.authors.map((a) => ({ name: a.name }))
          : undefined,
    })
  }

  writeFileSync(join(OUT_DIR, "feed.xml"), feed.rss2())
  writeFileSync(join(OUT_DIR, "atom.xml"), feed.atom1())
  console.log(
    `✓ feed.xml / atom.xml (${Math.min(posts.length, RSS_ITEM_LIMIT)} items)`
  )
}

function buildSitemap(posts: Awaited<ReturnType<typeof getPosts>>) {
  const today = new Date().toISOString().slice(0, 10)
  const entries: { loc: string; lastmod: string; priority: string }[] = [
    { loc: `${SITE_URL}/`, lastmod: today, priority: "1.0" },
    { loc: `${SITE_URL}/tags/`, lastmod: today, priority: "0.5" },
    { loc: `${SITE_URL}/about/`, lastmod: today, priority: "0.3" },
    ...posts.map((p) => ({
      loc: postUrl(p.slug),
      lastmod: p.date || today,
      priority: "0.8",
    })),
  ]
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>
`
  writeFileSync(join(OUT_DIR, "sitemap.xml"), xml)
  console.log(`✓ sitemap.xml (${entries.length} entries)`)
}

async function main() {
  try {
    mkdirSync(OUT_DIR, { recursive: true })
    const posts = await getPosts()
    await buildRss(posts)
    buildSitemap(posts)
  } catch (err) {
    // 빌드 자체는 끝났으므로, RSS/sitemap 생성 실패가 배포를 막지 않도록 경고만.
    console.warn(
      "[feed/sitemap] 생성 실패 — 빈 sitemap 으로 fallback. 다음 빌드에서 자동 복구.",
      err
    )
    // 최소한 빈 sitemap 이라도 만들어 두기 (404 방지)
    const fallback = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${SITE_URL}/</loc><priority>1.0</priority></url>
</urlset>
`
    try {
      writeFileSync(join(OUT_DIR, "sitemap.xml"), fallback)
    } catch {}
  }
}

main()
