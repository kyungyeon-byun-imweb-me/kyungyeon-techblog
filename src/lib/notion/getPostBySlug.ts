import type { ExtendedRecordMap } from "notion-types"
import { fetchPage } from "./client"
import { enrichAllUsers } from "./enrichUsers"
import { getPosts } from "./getPosts"
import type { TPost } from "@/types"

// 슬러그로 단일 글을 찾고, 본문 렌더링에 필요한 recordMap 까지 함께 반환합니다.
// recordMap 은 react-notion-x 의 <NotionRenderer recordMap={...} /> 에 그대로 전달됩니다.
export async function getPostBySlug(
  slug: string
): Promise<(TPost & { recordMap: ExtendedRecordMap }) | null> {
  const posts = await getPosts()
  const post = posts.find((p) => p.slug === slug)
  if (!post) return null

  const recordMap = await fetchPage(post.id)
  await enrichAllUsers(recordMap)
  return { ...post, recordMap }
}
