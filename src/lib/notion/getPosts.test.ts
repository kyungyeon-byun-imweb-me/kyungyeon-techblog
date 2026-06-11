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
      { id: "1", title: "A", status: "발행 완료" },
      { id: "2", title: "B", status: "발행 완료" },
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
  it("발행 완료 상태 글만 노출하고 작성중 글은 제외한다", () => {
    const rm = buildRecordMap([
      { id: "1", title: "발행완료", status: "발행 완료" },
      { id: "2", title: "작성중", status: "작성중" },
    ])
    const { posts } = snapshotFromRecordMap(rm)
    expect(posts.map((p) => p.title)).toEqual(["발행완료"])
  })

  it("발행 완료 상태만 게시 상태로 판별한다", () => {
    expect(isPublishedStatus("발행 완료")).toBe(true)
    expect(isPublishedStatus("작성중")).toBe(false)
  })

  it("로컬 확인 옵션이 켜지면 미발행 상태 글도 포함한다", () => {
    const rm = buildRecordMap([
      { id: "1", title: "발행완료", status: "발행 완료", postNo: 2 },
      { id: "2", title: "작성중", status: "작성중", postNo: 1 },
    ])
    const { posts } = snapshotFromRecordMap(rm, { includeUnpublished: true })
    expect(posts.map((p) => p.title)).toEqual(["발행완료", "작성중"])
  })

  it("status 미지정 글은 작성중으로 간주해 기본 목록에서 제외한다", () => {
    const rm = buildRecordMap([{ id: "1", title: "상태없음" }])
    const { posts } = snapshotFromRecordMap(rm)
    expect(posts).toHaveLength(0)

    const local = snapshotFromRecordMap(rm, { includeUnpublished: true })
    expect(local.posts).toHaveLength(1)
    expect(local.posts[0].status).toBe("작성중")
  })

  it("page 타입이 아닌 블록은 무시한다", () => {
    const rm = buildRecordMap([
      { id: "1", title: "글", status: "발행 완료" },
      { id: "2", title: "잡블록", status: "발행 완료", type: "text" },
    ])
    const { posts } = snapshotFromRecordMap(rm)
    expect(posts).toHaveLength(1)
    expect(posts[0].id).toBe("1")
  })

  it("postNo 내림차순으로 정렬한다", () => {
    const rm = buildRecordMap([
      {
        id: "1",
        title: "postNo 1",
        status: "발행 완료",
        postNo: 1,
        date: "2026-05-20",
      },
      {
        id: "2",
        title: "postNo 3",
        status: "발행 완료",
        postNo: 3,
        date: "2026-01-10",
      },
      {
        id: "3",
        title: "postNo 2",
        status: "발행 완료",
        postNo: 2,
        date: "2026-03-15",
      },
    ])
    const { posts } = snapshotFromRecordMap(rm)
    expect(posts.map((p) => p.title)).toEqual([
      "postNo 3",
      "postNo 2",
      "postNo 1",
    ])
  })

  it("postNo 가 없으면 발행일 내림차순으로 정렬한다", () => {
    const rm = buildRecordMap([
      { id: "1", title: "오래된글", status: "발행 완료", date: "2026-01-10" },
      { id: "2", title: "최신글", status: "발행 완료", date: "2026-05-20" },
      { id: "3", title: "중간글", status: "발행 완료", date: "2026-03-15" },
    ])
    const { posts } = snapshotFromRecordMap(rm)
    expect(posts.map((p) => p.title)).toEqual(["최신글", "중간글", "오래된글"])
  })

  it("카테고리는 스키마 정의 순서를 유지하고 0건도 노출한다 (multi-select)", () => {
    const rm = buildRecordMap([
      { id: "1", title: "a", status: "발행 완료", category: ["Design"] },
      { id: "2", title: "b", status: "발행 완료", category: ["Engineering"] },
      { id: "3", title: "c", status: "발행 완료", category: ["Engineering", "Design"] },
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
      { id: "1", title: "a", status: "발행 완료", tags: ["React", "TypeScript"] },
      { id: "2", title: "b", status: "발행 완료", tags: ["React"] },
      { id: "3", title: "c", status: "발행 완료", tags: ["React", "TypeScript"] },
      { id: "4", title: "d", status: "발행 완료", tags: ["CSS"] },
    ])
    const { tags } = snapshotFromRecordMap(rm)
    expect(tags[0]).toEqual({ name: "React", count: 3 })
    expect(tags[1]).toEqual({ name: "TypeScript", count: 2 })
    expect(tags.find((t) => t.name === "CSS")).toEqual({ name: "CSS", count: 1 })
  })

  it("신형 collection_group_results 응답에서도 동일하게 동작한다", () => {
    const rm = buildRecordMap(
      [{ id: "1", title: "글", status: "발행 완료" }],
      { useGroupResults: true }
    )
    const { posts } = snapshotFromRecordMap(rm)
    expect(posts).toHaveLength(1)
  })

  it("대량(200건) 글도 누락 없이 전부 변환한다", () => {
    const many = Array.from({ length: 200 }, (_, i) => ({
      id: `post-${i}`,
      title: `글 ${i}`,
      status: "발행 완료",
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
