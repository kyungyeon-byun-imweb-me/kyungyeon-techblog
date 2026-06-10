import type { GetStaticProps, InferGetStaticPropsType } from "next"
import HomePageContent, { getTotalHomePages } from "@/components/home/HomePageContent"
import { getCategories, getPosts } from "@/lib/notion/getPosts"
import { safeAsync } from "@/lib/utils/safeAsync"

type Props = {
  posts: Awaited<ReturnType<typeof getPosts>>
  categories: Awaited<ReturnType<typeof getCategories>>
  totalPages: number
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  const props = await safeAsync(
    async () => {
      const [posts, categories] = await Promise.all([getPosts(), getCategories()])
      return { posts, categories, totalPages: getTotalHomePages(posts.length) }
    },
    { posts: [], categories: [], totalPages: 1 },
    "home"
  )
  return { props }
}

export default function HomePage({
  posts,
  categories,
  totalPages,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  return (
    <HomePageContent
      posts={posts}
      categories={categories}
      currentPage={1}
      totalPages={totalPages}
    />
  )
}
