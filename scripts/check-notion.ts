const { loadLocalEnv } = require("./load-env.cjs")

loadLocalEnv(process.cwd())

async function main() {
  const sourceId =
    process.env.NOTION_PAGE_ID?.trim() || process.env.NOTION_DATABASE_ID?.trim()

  if (!sourceId) {
    console.error("[notion] NOTION_PAGE_ID or NOTION_DATABASE_ID is missing.")
    process.exit(1)
  }

  const {
    getPosts,
    shouldIncludeUnpublishedPosts,
  } = require(
    "../src/lib/notion/getPosts"
  ) as typeof import("../src/lib/notion/getPosts")

  try {
    const posts = await getPosts()
    const includeUnpublished = shouldIncludeUnpublishedPosts()
    console.log(`[notion] source id: ${sourceId}`)
    console.log(
      `[notion] ${includeUnpublished ? "local posts" : "published posts"}: ${posts.length}`
    )
    for (const post of posts) {
      const postNo = post.postNo ? `postNo=${post.postNo}` : "postNo=-"
      const cover = post.cover ? "cover=yes" : "cover=no"
      console.log(
        `- ${post.title} / ${post.slug} / ${postNo} / ${cover} / ${post.status}`
      )
    }
  } catch (err) {
    console.error("[notion] fetch failed.")
    console.error(err)
    process.exit(1)
  }
}

main()
