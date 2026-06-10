import type { ExtendedRecordMap } from "notion-types"

// 비공식 Notion API 응답(recordMap) 의 최소 형태를 흉내 내는 테스트 fixture 빌더.
// 실제 응답은 속성이 schema 의 hash id 로 keyed 되고, 값은 중첩 배열이라
// 파서(mapPage)/스냅샷(getPosts) 로직을 검증하려면 이 구조를 그대로 재현해야 합니다.

// schema 의 hash id (실제로는 4자 해시지만 테스트에선 의미 있는 키 사용)
export const PROP = {
  postNo: "p_no",
  status: "p_st",
  category: "p_cat",
  tags: "p_tag",
  summary: "p_sum",
  date: "p_date",
  thumbnail: "p_thumb",
} as const

export const SCHEMA = {
  // title 은 notion 에서 항상 "title" 키로 옵니다 (hash id 아님)
  title: { name: "Name", type: "title" },
  [PROP.postNo]: { name: "postNo", type: "number" },
  [PROP.status]: { name: "status", type: "select" },
  [PROP.category]: {
    name: "category",
    type: "multi_select",
    // 카테고리는 스키마 정의 순서가 사이드바 노출 순서가 됨
    options: [{ value: "Engineering" }, { value: "Design" }, { value: "Culture" }],
  },
  [PROP.tags]: { name: "tags", type: "multi_select" },
  [PROP.summary]: { name: "summary", type: "text" },
  [PROP.date]: { name: "date", type: "date" },
  [PROP.thumbnail]: { name: "thumbnail", type: "file" },
}

export type PostInput = {
  id: string
  title: string
  postNo?: string | number
  status?: string
  category?: string[]
  tags?: string[]
  summary?: string
  date?: string // ISO "YYYY-MM-DD"
  thumbnail?: string
  type?: string // 기본 "page"
}

const textProp = (value: string) => [[value]]
const multiSelectProp = (values: string[]) => [[values.join(",")]]
const dateProp = (iso: string) => [["‣", [["d", { type: "date", start_date: iso }]]]]

const buildBlock = (post: PostInput) => {
  const properties: Record<string, unknown> = {
    title: textProp(post.title),
  }
  if (post.postNo !== undefined)
    properties[PROP.postNo] = textProp(String(post.postNo))
  if (post.status !== undefined) properties[PROP.status] = textProp(post.status)
  if (post.category !== undefined)
    properties[PROP.category] = multiSelectProp(post.category)
  if (post.tags !== undefined) properties[PROP.tags] = multiSelectProp(post.tags)
  if (post.summary !== undefined)
    properties[PROP.summary] = textProp(post.summary)
  if (post.date !== undefined) properties[PROP.date] = dateProp(post.date)
  if (post.thumbnail !== undefined) {
    properties[PROP.thumbnail] = [
      ["thumbnail.png", [["a", post.thumbnail]]],
    ]
  }

  return {
    role: "reader",
    value: {
      id: post.id,
      type: post.type ?? "page",
      properties,
      created_time: Date.parse("2026-01-01"),
    },
  }
}

type BuildOptions = {
  // collection_query 결과를 신형(collection_group_results) 으로 감쌀지 여부
  useGroupResults?: boolean
}

// 여러 글을 담은 최소 recordMap 생성
export const buildRecordMap = (
  posts: PostInput[],
  opts: BuildOptions = {}
): ExtendedRecordMap => {
  const collId = "coll_1"
  const viewId = "view_1"

  const block: Record<string, unknown> = {}
  for (const p of posts) block[p.id] = buildBlock(p)

  const ids = posts.map((p) => p.id)
  const queryResult = opts.useGroupResults
    ? { collection_group_results: { blockIds: ids } }
    : { blockIds: ids }

  return {
    block,
    collection: {
      [collId]: { role: "reader", value: { id: collId, schema: SCHEMA } },
    },
    collection_view: {},
    collection_query: {
      [collId]: { [viewId]: queryResult },
    },
    notion_user: {},
    signed_urls: {},
  } as unknown as ExtendedRecordMap
}
