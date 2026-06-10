import type { GetStaticProps, InferGetStaticPropsType } from "next"
import { useRouter } from "next/router"
import { useEffect, useMemo, useState } from "react"
import ModernPostCard from "@/components/home/ModernPostCard"
import ModernLayout from "@/components/layout/ModernLayout"
import { getPosts } from "@/lib/notion/getPosts"
import { safeAsync } from "@/lib/utils/safeAsync"

type Props = {
  posts: Awaited<ReturnType<typeof getPosts>>
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  const posts = await safeAsync(() => getPosts(), [], "search")
  return { props: { posts } }
}

export default function SearchPage({
  posts,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  const router = useRouter()
  const [query, setQuery] = useState("")

  useEffect(() => {
    if (!router.isReady) return
    setQuery(typeof router.query.q === "string" ? router.query.q : "")
  }, [router.isReady, router.query.q])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return []
    return posts.filter((post) =>
      [post.title, post.summary, ...post.category, ...post.tags]
        .join(" ")
        .toLowerCase()
        .includes(needle)
    )
  }, [posts, query])

  return (
    <ModernLayout>
      <div className="modern-blog-layout">
        <section className="hero-section compact">
          <div className="container">
            <div className="search-container">
              <span className="search-icon" aria-hidden>
                🔍
              </span>
              <input
                type="search"
                placeholder="Search articles..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="search-input"
                autoFocus
                aria-label="글 검색"
              />
            </div>
          </div>
        </section>
        <section className="posts-section">
          <div className="container">
            <div className="posts-header">
              <h3 className="section-title">Search Results</h3>
              <p className="posts-count">{filtered.length} articles found</p>
            </div>
            <div className="posts-grid">
              {filtered.map((post) => (
                <ModernPostCard key={post.id} post={post} />
              ))}
            </div>
            {query.trim() && filtered.length === 0 && (
              <div className="no-posts">
                <p>No articles found matching your criteria.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </ModernLayout>
  )
}
