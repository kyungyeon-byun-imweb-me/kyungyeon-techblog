import type { GetStaticProps, InferGetStaticPropsType } from "next"
import Link from "next/link"
import Seo from "@/components/common/Seo"
import ModernLayout from "@/components/layout/ModernLayout"
import { getCategories, getPosts } from "@/lib/notion/getPosts"
import { safeAsync } from "@/lib/utils/safeAsync"

type Props = {
  categories: Awaited<ReturnType<typeof getCategories>>
  total: number
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  const props = await safeAsync(
    async () => {
      const [posts, categories] = await Promise.all([getPosts(), getCategories()])
      return { posts, categories }
    },
    { posts: [], categories: [] },
    "categories"
  )

  return {
    props: {
      categories: props.categories,
      total: props.posts.length,
    },
  }
}

export default function CategoriesPage({
  categories,
  total,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  return (
    <ModernLayout>
      <Seo title="Categories" path="/categories/" />
      <main className="article-container utility-page">
        <header className="article-meta-header">
          <h1 className="article-title">Categories</h1>
          <p className="article-excerpt">
            {total}개의 글이 {categories.length}개의 카테고리로 정리되어 있습니다
          </p>
        </header>

        <div className="tag-cloud">
          {categories.map((category) => (
            <Link
              key={category.name}
              href={`/?category=${encodeURIComponent(category.name)}`}
              className="tag-badge"
            >
              {category.name} · {category.count}
            </Link>
          ))}
        </div>
      </main>
    </ModernLayout>
  )
}
