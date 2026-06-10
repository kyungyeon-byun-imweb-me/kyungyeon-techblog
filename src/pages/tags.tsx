import type { GetStaticProps, InferGetStaticPropsType } from "next"
import Link from "next/link"
import Seo from "@/components/common/Seo"
import ModernLayout from "@/components/layout/ModernLayout"
import { getPosts, getTags } from "@/lib/notion/getPosts"
import { safeAsync } from "@/lib/utils/safeAsync"

type Props = {
  tags: Awaited<ReturnType<typeof getTags>>
  total: number
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  const props = await safeAsync(
    async () => {
      const [posts, tags] = await Promise.all([getPosts(), getTags()])
      return { tags, total: posts.length }
    },
    { tags: [], total: 0 },
    "tags"
  )
  return { props }
}

export default function TagsPage({
  tags,
  total,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  return (
    <ModernLayout>
      <Seo title="Tags" path="/tags/" />
      <main className="article-container utility-page">
        <header className="article-meta-header">
          <h1 className="article-title">Tags</h1>
          <p className="article-excerpt">
            {total}개의 글에서 추출된 {tags.length}개의 태그
          </p>
        </header>
        <div className="tag-cloud">
          {tags.map((tag) => (
            <Link key={tag.name} href={`/?tag=${encodeURIComponent(tag.name)}`} className="tag-badge">
              #{tag.name} · {tag.count}
            </Link>
          ))}
        </div>
      </main>
    </ModernLayout>
  )
}
