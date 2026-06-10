import type { GetStaticPaths, GetStaticProps, InferGetStaticPropsType } from "next"
import Seo from "@/components/common/Seo"
import HomePageContent, { getTotalHomePages } from "@/components/home/HomePageContent"
import { getCategories, getPosts } from "@/lib/notion/getPosts"
import type { TPost } from "@/types"

type CategorySummary = Awaited<ReturnType<typeof getCategories>>[number]

type Props = {
  posts: TPost[]
  categories: CategorySummary[]
  currentPage: number
  totalPages: number
}

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = await getPosts()
  const totalPages = getTotalHomePages(posts.length)
  const paths = Array.from({ length: Math.max(0, totalPages - 1) }, (_, index) => ({
    params: { page: String(index + 2) },
  }))

  return { paths, fallback: false }
}

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const currentPage = Number(params?.page)
  const [posts, categories] = await Promise.all([getPosts(), getCategories()])
  const totalPages = getTotalHomePages(posts.length)

  if (!Number.isInteger(currentPage) || currentPage < 2 || currentPage > totalPages) {
    return { notFound: true }
  }

  return {
    props: {
      posts,
      categories,
      currentPage,
      totalPages,
    },
  }
}

export default function HomeListPage({
  posts,
  categories,
  currentPage,
  totalPages,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  return (
    <>
      <Seo title={`Articles ${currentPage}`} path={`/pages/${currentPage}/`} />
      <HomePageContent
        posts={posts}
        categories={categories}
        currentPage={currentPage}
        totalPages={totalPages}
      />
    </>
  )
}
