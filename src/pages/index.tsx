import type { GetStaticProps, InferGetStaticPropsType } from "next"
import { useRouter } from "next/router"
import { useEffect, useMemo, useState } from "react"
import ModernLayout from "@/components/layout/ModernLayout"
import ModernPostCard from "@/components/home/ModernPostCard"
import { getCategories, getPosts } from "@/lib/notion/getPosts"
import { safeAsync } from "@/lib/utils/safeAsync"

type Props = {
  posts: Awaited<ReturnType<typeof getPosts>>
  categories: Awaited<ReturnType<typeof getCategories>>
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  const props = await safeAsync(
    async () => {
      const [posts, categories] = await Promise.all([getPosts(), getCategories()])
      return { posts, categories }
    },
    { posts: [], categories: [] },
    "home"
  )
  return { props }
}

export default function HomePage({
  posts,
  categories,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [searchQuery, setSearchQuery] = useState(
    typeof router.query.tag === "string" ? router.query.tag : ""
  )

  useEffect(() => {
    if (!router.isReady) return
    if (typeof router.query.tag === "string") setSearchQuery(router.query.tag)
  }, [router.isReady, router.query.tag])

  const categoryNames = useMemo(
    () => ["All", ...categories.filter((c) => c.count > 0).map((c) => c.name)],
    [categories]
  )

  const filteredPosts = useMemo(() => {
    const needle = searchQuery.trim().toLowerCase()
    return posts.filter((post) => {
      const matchesCategory =
        selectedCategory === "All" || post.category.includes(selectedCategory)
      const haystack = [post.title, post.summary, ...post.category, ...post.tags]
        .join(" ")
        .toLowerCase()
      const matchesSearch = needle === "" || haystack.includes(needle)
      return matchesCategory && matchesSearch
    })
  }, [posts, searchQuery, selectedCategory])

  const showFeatured = selectedCategory === "All" && searchQuery.trim() === ""
  const featuredPosts = showFeatured
    ? filteredPosts.filter((post) => post.featured).slice(0, 2)
    : []
  const fallbackFeatured =
    showFeatured && featuredPosts.length < 2
      ? filteredPosts
          .filter((post) => !featuredPosts.some((featured) => featured.id === post.id))
          .slice(0, 2 - featuredPosts.length)
      : []
  const visibleFeatured = [...featuredPosts, ...fallbackFeatured]
  const regularPosts = showFeatured
    ? filteredPosts.filter((post) => !visibleFeatured.some((featured) => featured.id === post.id))
    : filteredPosts

  return (
    <ModernLayout>
      <div className="modern-blog-layout">
        <section className="hero-section">
          <div className="container">
            <div className="search-container">
              <span className="search-icon" aria-hidden>
                🔍
              </span>
              <input
                type="search"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="search-input"
                aria-label="글 검색"
              />
            </div>
          </div>
        </section>

        <section className="category-filter-section">
          <div className="container">
            <div className="category-buttons">
              {categoryNames.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={`category-btn ${selectedCategory === category ? "active" : ""}`}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </section>

        {showFeatured && visibleFeatured.length > 0 && (
          <section className="featured-section">
            <div className="container">
              <h3 className="section-title">Featured Article</h3>
              <div className="featured-grid">
                {visibleFeatured.map((post) => (
                  <ModernPostCard key={post.id} post={post} />
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="posts-section">
          <div className="container">
            <div className="posts-header">
              <h3 className="section-title">Latest Articles</h3>
              <p className="posts-count">{regularPosts.length} articles found</p>
            </div>

            <div className="posts-grid">
              {regularPosts.map((post) => (
                <ModernPostCard key={post.id} post={post} />
              ))}
            </div>

            {regularPosts.length === 0 && (
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
