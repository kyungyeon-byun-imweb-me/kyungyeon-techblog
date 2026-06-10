import { describe, it, expect } from "vitest"
import {
  extractBlockIds,
  extractCollection,
  isPublishedStatus,
  snapshotFromRecordMap,
} from "./getPosts"
import { buildRecordMap, SCHEMA } from "./__fixtures__/recordMap"

describe("extractBlockIds", () => {
  it("구형 응답(blockIds 직접)에서 id 목록을 뽑는다", () => {
    expect(extractBlockIds({ blockIds: ["a", "b"] })).toEqual(["a", "b"])
  })

  it("신형 응답(collection_group_results)에서 id 목록을 뽑는다", () => {
    expect(
      extractBlockIds({ collection_group_results: { blockIds: ["x"] } })
    ).toEqual(["x"])
  })

  it("쿼리가 없거나 비면 빈 배열", () => {
    expect(extractBlockIds(undefined)).toEqual([])
    expect(extractBlockIds({})).toEqual([])
  })
})

describe("extractCollection", () => {
  it("schema 와 행 id 목록을 추출한다", () => {
    const rm = buildRecordMap([
      { id: "1", title: "A", status: "Public" },
      { id: "2", title: "B", status: "Public" },
    ])
    const coll = extractCollection(rm)
    expect(coll).not.toBeNull()
    expect(coll!.ids).toEqual(["1", "2"])
    expect(coll!.schema).toBe(SCHEMA)
  })

  it("collection 이 없으면 null", () => {
    expect(extractCollection({} as any)).toBeNull()
  })
})

describe("snapshotFromRecordMap", () => {
  it("게시 상태 글만 노출하고 PublicOnDetail/Draft 등은 제외한다", () => {
    const rm = buildRecordMap([
      { id: "1", title: "공개글", status: "Public" },
      { id: "2", title: "상세전용", status: "PublicOnDetail" },
      { id: "3", title: "초안", status: "Draft" },
      { id: "4", title: "한글공개", status: "공개" },
      { id: "5", title: "발행완료", status: "발행 완료" },
    ])
    const { posts } = snapshotFromRecordMap(rm)
    expect(posts.map((p) => p.title).sort()).toEqual([
      "공개글",
      "발행완료",
      "한글공개",
    ])
  })

  it("게시 상태 alias 를 판별한다", () => {
    expect(isPublishedStatus("Public")).toBe(true)
    expect(isPublishedStatus("공개")).toBe(true)
    expect(isPublishedStatus("발행 완료")).toBe(true)
    expect(isPublishedStatus("Private")).toBe(false)
    expect(isPublishedStatus("Draft")).toBe(false)
  })

  it("status 미지정 글은 Public 으로 간주한다", () => {
    const rm = buildRecordMap([{ id: "1", title: "상태없음" }])
    const { posts } = snapshotFromRecordMap(rm)
    expect(posts).toHaveLength(1)
    expect(posts[0].status).toBe("Public")
  })

  it("page 타입이 아닌 블록은 무시한다", () => {
    const rm = buildRecordMap([
      { id: "1", title: "글", status: "Public" },
      { id: "2", title: "잡블록", status: "Public", type: "text" },
    ])
    const { posts } = snapshotFromRecordMap(rm)
    expect(posts).toHaveLength(1)
    expect(posts[0].id).toBe("1")
  })

  it("발행일 내림차순(최신 우선)으로 정렬한다", () => {
    const rm = buildRecordMap([
      { id: "1", title: "오래된글", status: "Public", date: "2026-01-10" },
      { id: "2", title: "최신글", status: "Public", date: "2026-05-20" },
      { id: "3", title: "중간글", status: "Public", date: "2026-03-15" },
    ])
    const { posts } = snapshotFromRecordMap(rm)
    expect(posts.map((p) => p.title)).toEqual(["최신글", "중간글", "오래된글"])
  })

  it("카테고리는 스키마 정의 순서를 유지하고 0건도 노출한다 (multi-select)", () => {
    const rm = buildRecordMap([
      { id: "1", title: "a", status: "Public", category: ["Design"] },
      { id: "2", title: "b", status: "Public", category: ["Engineering"] },
      { id: "3", title: "c", status: "Public", category: ["Engineering", "Design"] },
    ])
    const { categories } = snapshotFromRecordMap(rm)
    // 스키마 순서: Engineering, Design, Culture (Culture 는 0건). 한 글이 여러 카테고리에 속하면 각각 카운트.
    expect(categories).toEqual([
      { name: "Engineering", count: 2 },
      { name: "Design", count: 2 },
      { name: "Culture", count: 0 },
    ])
  })

  it("태그는 사용 빈도 내림차순으로 집계한다", () => {
    const rm = buildRecordMap([
      { id: "1", title: "a", status: "Public", tags: ["React", "TypeScript"] },
      { id: "2", title: "b", status: "Public", tags: ["React"] },
      { id: "3", title: "c", status: "Public", tags: ["React", "TypeScript"] },
      { id: "4", title: "d", status: "Public", tags: ["CSS"] },
    ])
    const { tags } = snapshotFromRecordMap(rm)
    expect(tags[0]).toEqual({ name: "React", count: 3 })
    expect(tags[1]).toEqual({ name: "TypeScript", count: 2 })
    expect(tags.find((t) => t.name === "CSS")).toEqual({ name: "CSS", count: 1 })
  })

  it("신형 collection_group_results 응답에서도 동일하게 동작한다", () => {
    const rm = buildRecordMap(
      [{ id: "1", title: "글", status: "Public" }],
      { useGroupResults: true }
    )
    const { posts } = snapshotFromRecordMap(rm)
    expect(posts).toHaveLength(1)
  })

  it("대량(200건) 글도 누락 없이 전부 변환한다", () => {
    const many = Array.from({ length: 200 }, (_, i) => ({
      id: `post-${i}`,
      title: `글 ${i}`,
      status: "Public",
      date: `2026-01-${String((i % 28) + 1).padStart(2, "0")}`,
    }))
    const { posts } = snapshotFromRecordMap(buildRecordMap(many))
    expect(posts).toHaveLength(200)
  })

  it("collection 이 없으면 빈 스냅샷", () => {
    const empty = snapshotFromRecordMap({} as any)
    expect(empty).toEqual({ posts: [], categories: [], tags: [] })
  })
})
