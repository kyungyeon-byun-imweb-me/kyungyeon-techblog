import Link from "next/link"
import CoverImage from "@/components/common/CoverImage"
import { formatDateShort } from "@/lib/utils/formatDate"
import type { TPost } from "@/types"

const readTime = (post: TPost) => {
  const basis = [post.title, post.summary, ...post.tags, ...post.category].join(" ")
  return `${Math.max(3, Math.ceil(basis.length / 400))} min read`
}

export default function ModernPostCard({
  post,
}: {
  post: TPost
}) {
  const category = post.category[0] || "Technology"
  const href = `/posts/${encodeURIComponent(post.slug)}`

  return (
    <Link href={href} className="post-card-link">
      <div className="modern-post-card">
        <div className="post-image-container">
          <CoverImage src={post.cover} alt={post.title} title={post.title} />
          <span className="post-badge">{category}</span>
        </div>

        <div className="post-content">
          <h4 className="post-title">{post.title}</h4>
          {post.summary && <p className="post-excerpt">{post.summary}</p>}

          <div className="post-tags">
            {(post.category.length > 0 ? post.category : ["Tech"]).slice(0, 3).map((name) => (
              <span key={name} className="tag-badge">
                <span className="tag-icon">#</span>
                {name}
              </span>
            ))}
          </div>

          <div className="post-divider" />

          <div className="post-footer">
            <div className="author-info">
              <div className="author-details">
                <div className="post-date-time">
                  <span>{formatDateShort(post.date)}</span>
                  <span>•</span>
                  <span>{readTime(post)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
