import type { ExtendedRecordMap } from "notion-types"
import { fetchPage } from "./client"
import { enrichAuthorUsers } from "./enrichUsers"
import { findPropId, mapBlockToPost, unwrap } from "./mapPage"
import type { TPost } from "@/types"

const CONFIG = require("../../../site.config")

// 노션 DB 는 한 빌드에서 여러 페이지(/, /tags, /search, /posts/[slug]) 의
// getStaticProps/Paths 가 동시에 요청합니다. 동일한 DB 를 매번 새로 fetch 하지
// 않도록 production 빌드에서는 첫 fetch 결과를 모듈 캐시에 보관합니다.
// dev 모드에서는 노션 변경이 즉시 반영되어야 해서 캐시하지 않습니다.
const SHOULD_MEMO = process.env.NODE_ENV === "production"
let cachedSnapshot: Promise<DbSnapshot> | null = null

export type DbSnapshot = {
  posts: TPost[]
  categories: { name: string; count: number }[]
  tags: { name: string; count: number }[]
}

type CollectionQueryResult = {
  blockIds?: string[]
  collection_group_results?: { blockIds?: string[] }
}

export const extractBlockIds = (
  query: CollectionQueryResult | undefined
): string[] => {
  if (!query) return []
  if (query.blockIds) return query.blockIds
  if (query.collection_group_results?.blockIds)
    return query.collection_group_results.blockIds
  return []
}

type Collection = {
  schema: Record<string, { name: string; type: string; options?: unknown }>
  ids: string[]
}

// recordMap 에서 첫 컬렉션의 schema 와 (정렬 전) 행 block id 목록을 추출.
// 네트워크 I/O 없이 순수하게 동작 → 단위 테스트 가능.
export const extractCollection = (
  recordMap: ExtendedRecordMap
): Collection | null => {
  const collectionEntry = Object.entries(recordMap.collection || {})[0]
  if (!collectionEntry) return null
  const [collId, collRecord] = collectionEntry
  const collection = unwrap(collRecord)
  const schema = collection?.schema
  if (!schema) return null

  const perView = recordMap.collection_query?.[collId]
  const firstQuery = perView
    ? (Object.values(perView)[0] as CollectionQueryResult | undefined)
    : undefined
  return { schema, ids: extractBlockIds(firstQuery) }
}

// recordMap → DbSnapshot 순수 변환. 작성자 보강(enrich)은 호출 전에 끝나 있어야 함.
// 네트워크 I/O 가 없으므로 fixture 만으로 단위 테스트 가능.
export const snapshotFromRecordMap = (
  recordMap: ExtendedRecordMap
): DbSnapshot => {
  const coll = extractCollection(recordMap)
  if (!coll) return { posts: [], categories: [], tags: [] }
  const { schema, ids } = coll

  // ── posts ─────────────────────────────────────────────────────────────
  const allPosts: TPost[] = []
  for (const id of ids) {
    const block = unwrap(recordMap.block[id])
    if (!block || block.type !== "page") continue
    allPosts.push(mapBlockToPost(block, schema, recordMap))
  }
  const posts = allPosts
    .filter((p) => p.status === "Public" || (p.status as string) === "공개")
    .sort((a, b) => (a.date < b.date ? 1 : -1))

  // ── categories: 스키마 정의 순서로 고정, 0건 카테고리도 노출 ──────────
  const categoryPropId = findPropId(schema, ["category", "카테고리"])
  const categoryOptions =
    (categoryPropId &&
      (schema[categoryPropId]?.options as { value: string }[] | undefined)) ||
    []
  const categoryCounts = new Map<string, number>()
  for (const p of posts) {
    for (const c of p.category) {
      categoryCounts.set(c, (categoryCounts.get(c) || 0) + 1)
    }
  }
  const categories = categoryOptions.map((o) => ({
    name: o.value,
    count: categoryCounts.get(o.value) || 0,
  }))

  // ── tags: 사용 빈도 내림차순 ──────────────────────────────────────────
  const tagCounts = new Map<string, number>()
  for (const p of posts) {
    for (const t of p.tags) tagCounts.set(t, (tagCounts.get(t) || 0) + 1)
  }
  const tags = Array.from(tagCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)

  return { posts, categories, tags }
}

const buildSnapshot = async (): Promise<DbSnapshot> => {
  const recordMap = await fetchPage(CONFIG.notion.databaseId)

  // 작성자 보강 (notion_user 매핑 추가) — snapshotFromRecordMap 전에 수행
  const coll = extractCollection(recordMap)
  if (coll) {
    const authorPropId = findPropId(coll.schema, ["author", "authors", "작성자"])
    if (authorPropId) {
      await enrichAuthorUsers(recordMap, coll.ids, authorPropId)
    }
  }

  return snapshotFromRecordMap(recordMap)
}

// 단일 진입점. production 에서는 첫 호출만 실제 fetch, 이후엔 메모이즈된 Promise 반환.
export const getDbSnapshot = (): Promise<DbSnapshot> => {
  if (SHOULD_MEMO && cachedSnapshot) return cachedSnapshot
  const promise = buildSnapshot()
  if (SHOULD_MEMO) cachedSnapshot = promise
  return promise
}

// 이하 thin wrapper — 페이지 코드의 기존 호출 시그니처 그대로 유지.
export async function getPosts(): Promise<TPost[]> {
  return (await getDbSnapshot()).posts
}

export async function getPostSlugs(): Promise<string[]> {
  return (await getDbSnapshot()).posts.map((p) => p.slug)
}

export async function getCategories(): Promise<DbSnapshot["categories"]> {
  return (await getDbSnapshot()).categories
}

export async function getTags(): Promise<DbSnapshot["tags"]> {
  return (await getDbSnapshot()).tags
}
