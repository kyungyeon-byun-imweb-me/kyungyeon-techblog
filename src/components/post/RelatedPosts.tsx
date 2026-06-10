import Link from "next/link"
import CoverImage from "@/components/common/CoverImage"
import type { TPost } from "@/types"

const readTime = (post: TPost) => {
  const basis = [post.title, post.summary, ...post.tags, ...post.category].join(" ")
  return `${Math.max(3, Math.ceil(basis.length / 400))} min read`
}

export default function RelatedPosts({ posts }: { posts: TPost[] }) {
  if (posts.length === 0) return null

  return (
    <section className="related-posts-section">
      <h3>Related Articles</h3>
      <div className="related-posts-grid">
        {posts.slice(0, 3).map((post) => (
          <Link
            key={post.id}
            href={`/posts/${encodeURIComponent(post.slug)}`}
            className="related-post-card"
          >
            <div className="related-post-image">
              <CoverImage src={post.cover} alt={post.title} title={post.title} />
            </div>
            <div className="related-post-content">
              <h4>{post.title}</h4>
              {post.summary && <p>{post.summary}</p>}
              <span className="read-time">{readTime(post)}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
