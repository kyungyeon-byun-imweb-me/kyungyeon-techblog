import type { Decoration, ExtendedRecordMap } from "notion-types"

type BlockRecord = Record<string, unknown>

const unwrap = (record: any): any => {
  if (!record) return null
  if (record.value) return unwrap(record.value)
  return record
}

const toPlainText = (value?: Decoration[]) =>
  value?.map(([text]) => text).join("") ?? ""

const getNumberedTextInfo = (block: any) => {
  if (block?.type !== "text") return null

  const title = block.properties?.title as Decoration[] | undefined
  const text = toPlainText(title)
  const match = text.match(/^(\s*)(\d+)[.)]\s+/)
  if (!match) return null

  return {
    number: Number(match[2]),
    prefixLength: match[0].length,
  }
}

const stripTitlePrefix = (
  title: Decoration[] | undefined,
  prefixLength: number
): Decoration[] => {
  if (!title?.length) return []

  let remaining = prefixLength
  const stripped: Decoration[] = []

  for (const segment of title) {
    const [text, formats] = segment
    if (remaining >= text.length) {
      remaining -= text.length
      continue
    }

    if (remaining > 0) {
      const nextText = text.slice(remaining)
      remaining = 0
      if (nextText) {
        stripped.push(
          formats ? [nextText, formats] : [nextText]
        )
      }
      continue
    }

    stripped.push(segment)
  }

  return stripped.length ? stripped : [[""]]
}

const asStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []

export const normalizeRecordMap = (
  recordMap: ExtendedRecordMap
): ExtendedRecordMap => {
  const blockRecords = (recordMap.block ?? {}) as BlockRecord
  const blocks = new Map<string, any>()

  for (const [id, record] of Object.entries(blockRecords)) {
    const block = unwrap(record)
    if (block) blocks.set(id, block)
  }

  const idsToConvert = new Map<string, number>()

  const flushRun = (run: { id: string; prefixLength: number }[]) => {
    if (run.length < 2) return
    for (const item of run) idsToConvert.set(item.id, item.prefixLength)
  }

  for (const block of blocks.values()) {
    const childIds = asStringArray(block.content)
    if (!childIds.length) continue

    let run: { id: string; number: number; prefixLength: number }[] = []

    for (const id of childIds) {
      const child = blocks.get(id)
      const info = getNumberedTextInfo(child)

      if (!info) {
        flushRun(run)
        run = []
        continue
      }

      const previous = run.at(-1)
      if (previous && info.number !== previous.number + 1) {
        flushRun(run)
        run = []
      }

      run.push({ id, ...info })
    }

    flushRun(run)
  }

  for (const [id, prefixLength] of idsToConvert) {
    const block = blocks.get(id)
    if (!block?.properties?.title) continue

    block.type = "numbered_list"
    block.properties.title = stripTitlePrefix(block.properties.title, prefixLength)
  }

  return recordMap
}
