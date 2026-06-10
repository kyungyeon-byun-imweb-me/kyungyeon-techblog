import type { ExtendedRecordMap } from "notion-types"
import { fetchUsers } from "./client"
import { unwrap } from "./mapPage"

// 공개 게시된 페이지의 recordMap 은 notion_user 가 비어있어 별도 fetch 가 필요합니다.
// 두 가지 사용 패턴:
//   - enrichAuthorUsers: 목록 페이지에서 author 컬럼의 user ID 만 빠르게 수집
//   - enrichAllUsers:    글 상세에서 모든 블록·메타에 등장하는 user ID 일괄 수집

const collectUserIdsFromProperties = (
  block: any,
  filterPropIds?: Set<string>
): string[] => {
  if (!block?.properties) return []
  const ids: string[] = []
  for (const [propId, value] of Object.entries(block.properties)) {
    if (filterPropIds && !filterPropIds.has(propId)) continue
    if (!Array.isArray(value)) continue
    for (const seg of value as any[]) {
      const annotations = seg?.[1] || []
      for (const a of annotations) {
        if (a?.[0] === "u" && typeof a[1] === "string") ids.push(a[1])
      }
    }
  }
  return ids
}

const collectUserIdsFromBlock = (block: any): string[] => {
  const ids = collectUserIdsFromProperties(block)
  if (block?.created_by_table === "notion_user" && block.created_by_id) {
    ids.push(block.created_by_id)
  }
  if (
    block?.last_edited_by_table === "notion_user" &&
    block.last_edited_by_id
  ) {
    ids.push(block.last_edited_by_id)
  }
  return ids
}

const mergeUsers = async (
  recordMap: ExtendedRecordMap,
  userIds: string[]
): Promise<void> => {
  const merged = await fetchUsers(userIds)
  if (merged) {
    recordMap.notion_user = {
      ...(recordMap.notion_user ?? {}),
      ...(merged as any),
    }
  }
}

// 목록용: 특정 페이지들의 author 속성에서만 user ID 수집
export const enrichAuthorUsers = async (
  recordMap: ExtendedRecordMap,
  pageIds: string[],
  authorPropId: string
): Promise<void> => {
  const filter = new Set([authorPropId])
  const ids = new Set<string>()
  for (const pageId of pageIds) {
    const block = unwrap(recordMap.block[pageId])
    for (const id of collectUserIdsFromProperties(block, filter)) ids.add(id)
  }
  if (ids.size === 0) return
  await mergeUsers(recordMap, [...ids])
}

// 상세용: 모든 블록의 모든 user 참조 (mention + 작성자·편집자 메타) 수집
export const enrichAllUsers = async (
  recordMap: ExtendedRecordMap
): Promise<void> => {
  const ids = new Set<string>()
  for (const record of Object.values(recordMap.block || {})) {
    const block = unwrap(record)
    if (!block) continue
    for (const id of collectUserIdsFromBlock(block)) ids.add(id)
  }
  if (ids.size === 0) return
  await mergeUsers(recordMap, [...ids])
}
