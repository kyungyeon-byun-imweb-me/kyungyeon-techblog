import { useRouter } from "next/router"
import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import ModernLayout from "@/components/layout/ModernLayout"
import ModernPostCard from "@/components/home/ModernPostCard"
import HomePagination from "@/components/home/HomePagination"
import type { TPost } from "@/types"

export const POSTS_PER_PAGE = 12
const ALL_CATEGORY = "All"

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
  return Math.max(1, Math.ceil(postCount / POSTS_PER_PAGE))
}

const getDefaultPagePosts = (posts: TPost[], currentPage: number): TPost[] => {
  const start = (currentPage - 1) * POSTS_PER_PAGE
  return posts.slice(start, start + POSTS_PER_PAGE)
}

export default function HomePageContent({
  posts,
  categories,
  currentPage,
  totalPages,
}: HomePageContentProps) {
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState(
    typeof router.query.category === "string" ? router.query.category : ALL_CATEGORY
  )
  const [selectedTag, setSelectedTag] = useState(
    typeof router.query.tag === "string" ? router.query.tag : ""
  )
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    if (!router.isReady) return
    setSelectedCategory(
      typeof router.query.category === "string"
        ? router.query.category
        : ALL_CATEGORY
    )
    setSelectedTag(typeof router.query.tag === "string" ? router.query.tag : "")
  }, [router.isReady, router.query.category, router.query.tag])

  const sidebarCategories = useMemo(
    () => {
      const visibleCategories = categories
        .filter((category) => category.count > 0)
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
        .slice(0, 10)
      const maxCategoryCount = Math.max(
        1,
        ...visibleCategories.map((category) => category.count)
      )

      return [
        { name: ALL_CATEGORY, count: posts.length, ratio: 100 },
        ...visibleCategories.map((category) => ({
          ...category,
          ratio: Math.max(8, Math.round((category.count / maxCategoryCount) * 100)),
        })),
      ]
    },
    [categories, posts.length]
  )

  const lensPosts = useMemo(() => {
    if (selectedCategory === ALL_CATEGORY) return posts
    return posts.filter((post) => post.category.includes(selectedCategory))
  }, [posts, selectedCategory])

  const relatedTags = useMemo(() => {
    const counts = new Map<string, number>()
    for (const post of lensPosts) {
      for (const tag of post.tags) counts.set(tag, (counts.get(tag) || 0) + 1)
    }

    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
      .slice(0, 10)
  }, [lensPosts])

  const selectCategory = (category: string) => {
    setSelectedCategory(category)
    setSelectedTag("")
  }

  const filteredPosts = useMemo(() => {
    const needle = searchQuery.trim().toLowerCase()
    return posts.filter((post) => {
      const matchesCategory =
        selectedCategory === ALL_CATEGORY || post.category.includes(selectedCategory)
      const matchesTag = !selectedTag || post.tags.includes(selectedTag)
      const haystack = [post.title, post.summary, ...post.category, ...post.tags]
        .join(" ")
        .toLowerCase()
      const matchesSearch = needle === "" || haystack.includes(needle)
      return matchesCategory && matchesTag && matchesSearch
    })
  }, [posts, searchQuery, selectedCategory, selectedTag])

  const hasActiveFilter =
    selectedCategory !== ALL_CATEGORY ||
    selectedTag !== "" ||
    searchQuery.trim().length > 0
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

        <section className="posts-section">
          <div className="container">
            <div className="posts-layout">
              <aside className="posts-sidebar" aria-label="글 필터">
                <div className="topic-lens">
                  <div className="topic-lens-header">
                    <p className="topic-lens-title">Topic Lens</p>
                    <span className="topic-lens-total">{posts.length}</span>
                  </div>

                  <div className="topic-lens-category-list">
                    {sidebarCategories.map((category) => (
                      <button
                        key={category.name}
                        type="button"
                        className={`topic-lens-category-button ${
                          selectedCategory === category.name ? "active" : ""
                        }`}
                        onClick={() => selectCategory(category.name)}
                        aria-pressed={selectedCategory === category.name}
                      >
                        <span className="topic-lens-category-meta">
                          <span className="topic-lens-category-name">
                            {category.name === ALL_CATEGORY ? "전체" : category.name}
                          </span>
                          <span className="topic-lens-category-count">
                            {category.count}
                          </span>
                        </span>
                        <span className="topic-lens-meter" aria-hidden>
                          <span style={{ width: `${category.ratio}%` }} />
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="topic-lens-keywords">
                    <p className="topic-lens-keywords-title">관련 키워드</p>
                    <div className="topic-lens-tag-list">
                      {relatedTags.map((tag) => (
                        <button
                          key={tag.name}
                          type="button"
                          className={`topic-lens-tag-button ${
                            selectedTag === tag.name ? "active" : ""
                          }`}
                          onClick={() =>
                            setSelectedTag((current) =>
                              current === tag.name ? "" : tag.name
                            )
                          }
                          aria-pressed={selectedTag === tag.name}
                        >
                          # {tag.name} · {tag.count}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="topic-lens-links">
                    <Link href="/categories">전체 주제</Link>
                    <Link href="/tags">모든 태그</Link>
                  </div>
                </div>
              </aside>

              <div className="posts-main">
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
            </div>
          </div>
        </section>
      </div>
    </ModernLayout>
  )
}
