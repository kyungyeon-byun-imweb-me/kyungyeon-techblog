import type { GetStaticPaths, GetStaticProps, InferGetStaticPropsType } from "next"
import dynamic from "next/dynamic"
import Link from "next/link"
import type { ExtendedRecordMap } from "notion-types"
import CoverImage from "@/components/common/CoverImage"
import Seo from "@/components/common/Seo"
import ModernLayout from "@/components/layout/ModernLayout"
import Donation from "@/components/post/Donation"
import PostActions from "@/components/post/PostActions"
import PostContent from "@/components/post/PostContent"
import RelatedPosts from "@/components/post/RelatedPosts"
import { getPostBySlug } from "@/lib/notion/getPostBySlug"
import { getPosts } from "@/lib/notion/getPosts"
import { formatDateShort } from "@/lib/utils/formatDate"
import { safeAsync } from "@/lib/utils/safeAsync"
import type { TPost } from "@/types"

const CONFIG = require("../../../site.config")

const Comments = dynamic(() => import("@/components/post/Comments"), {
  ssr: false,
})

type Props = {
  post: TPost
  recordMap: ExtendedRecordMap
  relatedPosts: TPost[]
}

const estimateReadTime = (post: TPost) => {
  const basis = [post.title, post.summary, ...post.tags, ...post.category].join(" ")
  return `${Math.max(3, Math.ceil(basis.length / 400))} min read`
}

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = await safeAsync(() => getPosts(), [], "posts/[slug]")
  return {
    paths: posts.map((post) => ({ params: { slug: post.slug } })),
    fallback: false,
  }
}

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = (params?.slug as string) || ""
  const result = await getPostBySlug(slug)
  if (!result) return { notFound: true }
  const { recordMap, ...post } = result
  const posts = await getPosts()
  const relatedPosts = posts.filter((item) => item.id !== post.id).slice(0, 3)
  return { props: { post, recordMap, relatedPosts } }
}

export default function PostPage({
  post,
  recordMap,
  relatedPosts,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  const description = post.summary || CONFIG.blog.description

  return (
    <ModernLayout>
      <Seo
        title={post.title}
        description={description}
        path={`/posts/${encodeURIComponent(post.slug)}/`}
        image={post.cover}
        type="article"
        post={post}
      />

      <div className="modern-blog-detail">
        <header className="article-header-section">
          <div className="container">
            <div className="article-actions">
              <Link href="/" className="back-button">
                <span className="arrow-icon" aria-hidden>
                  ←
                </span>
                Back to Articles
              </Link>
            </div>
          </div>
        </header>

        <article className="article-container">
          <header className="article-meta-header">
            <div className="category-tags">
              {post.category.map((category) => (
                <span key={category} className="category-badge">
                  {category}
                </span>
              ))}
              {post.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="tag-badge">
                  {tag}
                </span>
              ))}
            </div>

            <h1 className="article-title">{post.title}</h1>
            {post.summary && <p className="article-excerpt">{post.summary}</p>}

            <div className="author-section">
              <div className="author-info">
                <div className="author-details">
                  <div className="article-stats">
                    <span className="stat-item">
                      <span className="icon" aria-hidden>
                        📅
                      </span>
                      {formatDateShort(post.date)}
                    </span>
                    <span className="stat-item">
                      <span className="icon" aria-hidden>
                        ⏱
                      </span>
                      {estimateReadTime(post)}
                    </span>
                    <span className="stat-item">
                      {post.authors.map((author) => author.name).join(", ") || CONFIG.blog.author}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {post.cover && (
            <div className="article-featured-image">
              <CoverImage src={post.cover} alt={post.title} title={post.title} />
            </div>
          )}

          <PostContent recordMap={recordMap} />
          <PostActions post={post} />
          <Donation />
          <Comments />
          <footer className="article-footer">
            <RelatedPosts posts={relatedPosts} />
          </footer>
        </article>
      </div>
    </ModernLayout>
  )
}
