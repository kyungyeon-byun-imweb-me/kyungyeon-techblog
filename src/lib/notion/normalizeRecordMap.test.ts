import { describe, expect, it } from "vitest"
import type { ExtendedRecordMap } from "notion-types"
import { normalizeRecordMap } from "./normalizeRecordMap"

const textBlock = (id: string, title: string) => ({
  role: "reader",
  value: {
    id,
    type: "text",
    parent_id: "page",
    properties: {
      title: [[title]],
    },
  },
})

const pageBlock = (content: string[]) => ({
  role: "reader",
  value: {
    id: "page",
    type: "page",
    content,
  },
})

const blockValue = (recordMap: ExtendedRecordMap, id: string) =>
  (recordMap.block[id] as any).value

describe("normalizeRecordMap", () => {
  it("연속된 숫자 텍스트 블록을 numbered_list 블록으로 변환한다", () => {
    const recordMap = {
      block: {
        page: pageBlock(["1", "2", "3"]),
        "1": textBlock("1", "1. 첫 번째"),
        "2": textBlock("2", "2. 두 번째"),
        "3": textBlock("3", "3. 세 번째"),
      },
    } as unknown as ExtendedRecordMap

    normalizeRecordMap(recordMap)

    expect(blockValue(recordMap, "1").type).toBe("numbered_list")
    expect(blockValue(recordMap, "2").type).toBe("numbered_list")
    expect(blockValue(recordMap, "3").type).toBe("numbered_list")
    expect(blockValue(recordMap, "1").properties.title).toEqual([["첫 번째"]])
  })

  it("단독 숫자 텍스트 블록은 일반 문장으로 유지한다", () => {
    const recordMap = {
      block: {
        page: pageBlock(["1"]),
        "1": textBlock("1", "2026. 회고"),
      },
    } as unknown as ExtendedRecordMap

    normalizeRecordMap(recordMap)

    expect(blockValue(recordMap, "1").type).toBe("text")
    expect(blockValue(recordMap, "1").properties.title).toEqual([["2026. 회고"]])
  })
})
