import type { ExtendedRecordMap } from "notion-types"
import { fetchPage } from "./client"
import { enrichAuthorUsers } from "./enrichUsers"
import { findPropId, mapBlockToPost, unwrap } from "./mapPage"
import type { TPost } from "@/types"

const CONFIG = require("../../../site.config")

// 노션 DB 는 dev 서버와 빌드에서 여러 페이지(/, /tags, /search, /posts/[slug])가
// 동시에 요청합니다. public Notion API 는 rate limit 이 낮기 때문에 dev/prod 모두
// 같은 프로세스 안에서는 첫 snapshot Promise 를 재사용합니다.
type SnapshotCacheStore = {
  promise: Promise<DbSnapshot> | null
  error: unknown | null
  errorAt: number | null
}

const globalForSnapshot = globalThis as typeof globalThis & {
  __kyungyeonTechblogDbSnapshotCacheV2?: SnapshotCacheStore
}

if (!globalForSnapshot.__kyungyeonTechblogDbSnapshotCacheV2) {
  globalForSnapshot.__kyungyeonTechblogDbSnapshotCacheV2 = {
    promise: null,
    error: null,
    errorAt: null,
  }
}

const snapshotCache = globalForSnapshot.__kyungyeonTechblogDbSnapshotCacheV2
const SNAPSHOT_ERROR_COOLDOWN_MS = 60 * 1000

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

const PUBLISHED_STATUSES = new Set(["발행 완료"])

export const isPublishedStatus = (status: string): boolean =>
  PUBLISHED_STATUSES.has(status)

type SnapshotOptions = {
  includeUnpublished?: boolean
}

export const shouldIncludeUnpublishedPosts = (): boolean =>
  process.env.NOTION_INCLUDE_UNPUBLISHED === "true"

const postNoSortValue = (postNo: string | null): number | null => {
  if (!postNo) return null
  const numeric = Number(postNo)
  return Number.isFinite(numeric) ? numeric : null
}

export const comparePosts = (a: TPost, b: TPost): number => {
  const aPostNo = postNoSortValue(a.postNo)
  const bPostNo = postNoSortValue(b.postNo)

  if (aPostNo !== null && bPostNo !== null && aPostNo !== bPostNo) {
    return bPostNo - aPostNo
  }
  if (aPostNo !== null && bPostNo === null) return -1
  if (aPostNo === null && bPostNo !== null) return 1

  return a.date < b.date ? 1 : -1
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
  recordMap: ExtendedRecordMap,
  options: SnapshotOptions = {}
): DbSnapshot => {
  const coll = extractCollection(recordMap)
  if (!coll) return { posts: [], categories: [], tags: [] }
  const { schema, ids } = coll
  const includeUnpublished = options.includeUnpublished === true

  // ── posts ─────────────────────────────────────────────────────────────
  const allPosts: TPost[] = []
  for (const id of ids) {
    const block = unwrap(recordMap.block[id])
    if (!block || block.type !== "page") continue
    allPosts.push(mapBlockToPost(block, schema, recordMap))
  }
  const posts = allPosts
    .filter((p) => includeUnpublished || isPublishedStatus(p.status))
    .sort(comparePosts)

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

  return snapshotFromRecordMap(recordMap, {
    includeUnpublished: shouldIncludeUnpublishedPosts(),
  })
}

// 단일 진입점. 첫 호출만 실제 fetch/변환하고 이후엔 메모이즈된 Promise 반환.
export const getDbSnapshot = (): Promise<DbSnapshot> => {
  if (snapshotCache.promise) return snapshotCache.promise
  if (
    snapshotCache.error &&
    snapshotCache.errorAt &&
    Date.now() - snapshotCache.errorAt < SNAPSHOT_ERROR_COOLDOWN_MS
  ) {
    return Promise.reject(snapshotCache.error)
  }

  const promise = buildSnapshot()
    .then((snapshot) => {
      snapshotCache.error = null
      snapshotCache.errorAt = null
      return snapshot
    })
    .catch((error) => {
      snapshotCache.promise = null
      snapshotCache.error = error
      snapshotCache.errorAt = Date.now()
      throw error
    })

  snapshotCache.promise = promise
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
