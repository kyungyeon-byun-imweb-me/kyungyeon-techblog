import { describe, it, expect } from "vitest"
import { unwrap, findPropId, mapBlockToPost } from "./mapPage"
import { buildRecordMap, SCHEMA, PROP } from "./__fixtures__/recordMap"

// recordMap fixture 에서 단일 블록 value 를 꺼내는 헬퍼
const blockOf = (id: string, posts: Parameters<typeof buildRecordMap>[0]) => {
  const rm = buildRecordMap(posts)
  return { block: (rm.block[id] as any).value, recordMap: rm }
}

describe("unwrap", () => {
  it("notion-client 의 이중 래핑({value:{value}})을 풀어낸다", () => {
    expect(unwrap({ value: { value: { id: "x" } } })).toEqual({ id: "x" })
  })
  it("{role,value} 래핑을 풀어낸다", () => {
    expect(unwrap({ role: "reader", value: { id: "y" } })).toEqual({ id: "y" })
  })
  it("null/undefined 는 null 을 돌려준다", () => {
    expect(unwrap(null)).toBeNull()
    expect(unwrap(undefined)).toBeNull()
  })
  it("래핑이 없으면 그대로 돌려준다", () => {
    expect(unwrap({ id: "z" })).toEqual({ id: "z" })
  })
})

describe("findPropId", () => {
  it("이름(대소문자 무시)으로 schema 의 prop id 를 찾는다", () => {
    expect(findPropId(SCHEMA as any, ["status"])).toBe(PROP.status)
    expect(findPropId(SCHEMA as any, ["STATUS"])).toBe(PROP.status)
  })
  it("alias 중 하나라도 매치되면 찾는다", () => {
    expect(findPropId(SCHEMA as any, ["분류", "category"])).toBe(PROP.category)
  })
  it("매치 없으면 null", () => {
    expect(findPropId(SCHEMA as any, ["없는속성"])).toBeNull()
  })
})

describe("mapBlockToPost", () => {
  it("기본 속성(title/summary/category/tags/date/status)을 파싱한다", () => {
    const { block, recordMap } = blockOf("1", [
      {
        id: "1",
        title: "테스트 글",
        status: "발행 완료",
        category: ["Engineering"],
        tags: ["React", "TypeScript"],
        summary: "요약입니다",
        date: "2026-05-13",
      },
    ])
    const post = mapBlockToPost(block, SCHEMA, recordMap)
    expect(post).toMatchObject({
      id: "1",
      title: "테스트 글",
      summary: "요약입니다",
      category: ["Engineering"],
      tags: ["React", "TypeScript"],
      date: "2026-05-13",
      status: "발행 완료",
    })
    expect(post.authors).toEqual([])
  })

  it("postNo 가 있으면 숫자 URL slug 로 우선 사용한다", () => {
    const { block, recordMap } = blockOf("1", [
      { id: "1", title: "Hello World", postNo: 42, status: "발행 완료" },
    ])
    const post = mapBlockToPost(block, SCHEMA, recordMap)
    expect(post.postNo).toBe("42")
    expect(post.slug).toBe("42")
  })

  it("postNo 의 콤마와 정수형 소수 표기를 URL 용 숫자로 정규화한다", () => {
    const comma = blockOf("1", [
      { id: "1", title: "A", postNo: "1,000", status: "발행 완료" },
    ])
    const decimal = blockOf("2", [
      { id: "2", title: "B", postNo: "1000.0", status: "발행 완료" },
    ])

    expect(mapBlockToPost(comma.block, SCHEMA, comma.recordMap).slug).toBe(
      "1000"
    )
    expect(mapBlockToPost(decimal.block, SCHEMA, decimal.recordMap).slug).toBe(
      "1000"
    )
  })

  it("slug 가 비면 title 로부터 생성한다", () => {
    const { block, recordMap } = blockOf("1", [
      { id: "1", title: "Hello World", status: "발행 완료" },
    ])
    const post = mapBlockToPost(block, SCHEMA, recordMap)
    expect(post.postNo).toBeNull()
    expect(post.slug).toBe("hello-world")
  })

  it("thumbnail file attachment 를 Notion 이미지 프록시 URL 로 변환한다", () => {
    const { block, recordMap } = blockOf("1", [
      {
        id: "1",
        title: "썸네일 글",
        status: "발행 완료",
        thumbnail: "attachment:abc-123:image.png",
      },
    ])
    const post = mapBlockToPost(block, SCHEMA, recordMap)

    expect(post.cover).toBe(
      "https://www.notion.so/image/attachment%3Aabc-123%3Aimage.png?table=block&id=1&cache=v2"
    )
  })

  it("title 도 slug 도 없으면 block id 를 slug 로 쓴다", () => {
    const { block, recordMap } = blockOf("blk-123", [
      { id: "blk-123", title: "", status: "발행 완료" },
    ])
    const post = mapBlockToPost(block, SCHEMA, recordMap)
    expect(post.slug).toBe("blk-123")
  })

  it("date 미지정 시 created_time 으로 채운다", () => {
    const { block, recordMap } = blockOf("1", [
      { id: "1", title: "날짜없음", status: "발행 완료" },
    ])
    const post = mapBlockToPost(block, SCHEMA, recordMap)
    expect(post.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it("date 가 비어 있으면 createdAt Created time 속성을 작성일로 쓴다", () => {
    const { block, recordMap } = blockOf("1", [
      {
        id: "1",
        title: "생성일 글",
        status: "발행 완료",
        createdAt: "2026-05-24",
      },
    ])
    const post = mapBlockToPost(block, SCHEMA, recordMap)
    expect(post.date).toBe("2026-05-24")
  })

  it("date 와 createdAt 이 모두 있으면 date 를 우선한다", () => {
    const { block, recordMap } = blockOf("1", [
      {
        id: "1",
        title: "발행일 우선 글",
        status: "발행 완료",
        date: "2026-05-13",
        createdAt: "2026-05-24",
      },
    ])
    const post = mapBlockToPost(block, SCHEMA, recordMap)
    expect(post.date).toBe("2026-05-13")
  })

  it("status 미지정 시 작성중으로 기본 처리한다", () => {
    const { block, recordMap } = blockOf("1", [{ id: "1", title: "글" }])
    const post = mapBlockToPost(block, SCHEMA, recordMap)
    expect(post.status).toBe("작성중")
  })

  it("tags 미지정 시 빈 배열", () => {
    const { block, recordMap } = blockOf("1", [
      { id: "1", title: "글", status: "발행 완료" },
    ])
    const post = mapBlockToPost(block, SCHEMA, recordMap)
    expect(post.tags).toEqual([])
  })
})
