import { useRouter } from "next/router"
import { useEffect, useMemo, useState } from "react"
import ModernLayout from "@/components/layout/ModernLayout"
import ModernPostCard from "@/components/home/ModernPostCard"
import HomePagination from "@/components/home/HomePagination"
import type { TPost } from "@/types"

export const FEATURED_POST_COUNT = 2
export const POSTS_PER_PAGE = 12
export const FIRST_PAGE_SIZE = FEATURED_POST_COUNT + POSTS_PER_PAGE

type CategorySummary = {
  name: string
  count: number
}

type HomePageContentProps = {
  posts: TPost[]
  categories: CategorySummary[]
  currentPage: number
  totalPages: number
}

export const getTotalHomePages = (postCount: number): number => {
  if (postCount <= FIRST_PAGE_SIZE) return 1
  return 1 + Math.ceil((postCount - FIRST_PAGE_SIZE) / POSTS_PER_PAGE)
}

const getDefaultPagePosts = (posts: TPost[], currentPage: number): TPost[] => {
  if (currentPage === 1) {
    return posts.slice(FEATURED_POST_COUNT, FIRST_PAGE_SIZE)
  }

  const start = FIRST_PAGE_SIZE + (currentPage - 2) * POSTS_PER_PAGE
  return posts.slice(start, start + POSTS_PER_PAGE)
}

export default function HomePageContent({
  posts,
  categories,
  currentPage,
  totalPages,
}: HomePageContentProps) {
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

  const hasActiveFilter =
    selectedCategory !== "All" || searchQuery.trim().length > 0
  const showFeatured = currentPage === 1 && !hasActiveFilter
  const featuredPosts = showFeatured ? posts.slice(0, FEATURED_POST_COUNT) : []
  const regularPosts = hasActiveFilter
    ? filteredPosts
    : getDefaultPagePosts(posts, currentPage)

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

        {showFeatured && featuredPosts.length > 0 && (
          <section className="featured-section">
            <div className="container">
              <h3 className="section-title">Featured Article</h3>
              <div className="featured-grid">
                {featuredPosts.map((post) => (
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

            {!hasActiveFilter && (
              <HomePagination currentPage={currentPage} totalPages={totalPages} />
            )}
          </div>
        </section>
      </div>
    </ModernLayout>
  )
}
