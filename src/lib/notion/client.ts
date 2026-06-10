import { createHash } from "node:crypto"
import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises"
import path from "node:path"
import { NotionAPI } from "notion-client"
import type { ExtendedRecordMap } from "notion-types"

// 비공식(public) Notion API 클라이언트.
// 토큰이 필요 없으며, 노션 페이지가 "웹에 게시(Share to web)" 되어 있어야 합니다.
const notion = new NotionAPI()

type PageCacheEntry = {
  promise?: Promise<ExtendedRecordMap>
  value?: ExtendedRecordMap
  error?: unknown
  errorAt?: number
}

type UserCacheEntry = {
  promise: Promise<Record<string, unknown> | null>
}

type NotionCacheStore = {
  pages: Map<string, PageCacheEntry>
  users: Map<string, UserCacheEntry>
}

const globalForNotion = globalThis as typeof globalThis & {
  __kyungyeonTechblogNotionCacheV2?: NotionCacheStore
}

if (!globalForNotion.__kyungyeonTechblogNotionCacheV2) {
  globalForNotion.__kyungyeonTechblogNotionCacheV2 = {
    pages: new Map(),
    users: new Map(),
  }
}

const notionCache = globalForNotion.__kyungyeonTechblogNotionCacheV2
const ERROR_COOLDOWN_MS = 60 * 1000
const DISK_CACHE_DIR = path.join(process.cwd(), ".next", "cache", "notion")
const NETWORK_LOCK_DIR = path.join(DISK_CACHE_DIR, ".network-lock")
const NETWORK_LAST_REQUEST_FILE = path.join(DISK_CACHE_DIR, ".last-request")
const NETWORK_LOCK_STALE_MS = 2 * 60 * 1000
const NETWORK_LOCK_POLL_MS = 250
const NOTION_REQUEST_INTERVAL_MS = Number(
  process.env.NOTION_REQUEST_INTERVAL_MS || 1500
)
const NOTION_MAX_ATTEMPTS = Number(process.env.NOTION_MAX_ATTEMPTS || 6)

const diskCachePath = (key: string) =>
  path.join(DISK_CACHE_DIR, `${createHash("sha1").update(key).digest("hex")}.json`)

const readDiskPageCache = async (
  key: string
): Promise<ExtendedRecordMap | null> => {
  try {
    return JSON.parse(await readFile(diskCachePath(key), "utf8")) as ExtendedRecordMap
  } catch {
    return null
  }
}

const writeDiskPageCache = async (
  key: string,
  recordMap: ExtendedRecordMap
): Promise<void> => {
  try {
    await mkdir(DISK_CACHE_DIR, { recursive: true })
    await writeFile(diskCachePath(key), JSON.stringify(recordMap), "utf8")
  } catch {
    // Disk cache is best-effort. Build output must not depend on it.
  }
}

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms))

const isRetryableNotionError = (error: unknown): boolean => {
  const err = error as { status?: number; statusCode?: number; message?: string }
  const status = err.status ?? err.statusCode
  if (status === 429 || status === 408) return true
  if (status && status >= 500) return true
  return /429|too many requests|rate limit/i.test(err.message || "")
}

const retryDelayMs = (attempt: number): number =>
  Math.min(30_000, 2000 * 2 ** attempt)

const acquireNetworkLock = async (): Promise<void> => {
  await mkdir(DISK_CACHE_DIR, { recursive: true })
  while (true) {
    try {
      await mkdir(NETWORK_LOCK_DIR, { recursive: false })
      return
    } catch {
      try {
        const lockStat = await stat(NETWORK_LOCK_DIR)
        if (Date.now() - lockStat.mtimeMs > NETWORK_LOCK_STALE_MS) {
          await rm(NETWORK_LOCK_DIR, { recursive: true, force: true })
          continue
        }
      } catch {
        // The lock disappeared between mkdir/stat. Retry immediately.
      }
      await sleep(NETWORK_LOCK_POLL_MS)
    }
  }
}

const releaseNetworkLock = async (): Promise<void> => {
  await rm(NETWORK_LOCK_DIR, { recursive: true, force: true }).catch(() => {})
}

const waitForNetworkTurn = async (): Promise<void> => {
  await mkdir(DISK_CACHE_DIR, { recursive: true })
  const lastRequest = Number(await readFile(NETWORK_LAST_REQUEST_FILE, "utf8").catch(() => "0"))
  const waitMs = Math.max(0, lastRequest + NOTION_REQUEST_INTERVAL_MS - Date.now())
  if (waitMs > 0) await sleep(waitMs)
  await writeFile(NETWORK_LAST_REQUEST_FILE, String(Date.now()), "utf8")
}

const withNetworkLock = async <T>(fn: () => Promise<T>): Promise<T> => {
  await acquireNetworkLock()
  try {
    await waitForNetworkTurn()
    return await fn()
  } finally {
    await releaseNetworkLock()
  }
}

const getPageWithRetry = async (key: string): Promise<ExtendedRecordMap> => {
  for (let attempt = 0; attempt < NOTION_MAX_ATTEMPTS; attempt += 1) {
    const cached = await readDiskPageCache(key)
    if (cached) return cached

    try {
      return await withNetworkLock(async () => {
        const lockedCached = await readDiskPageCache(key)
        if (lockedCached) return lockedCached
        return notion.getPage(key, DEFAULT_FETCH_OPTIONS as any)
      })
    } catch (error) {
      if (!isRetryableNotionError(error) || attempt === NOTION_MAX_ATTEMPTS - 1) {
        throw error
      }
      await sleep(retryDelayMs(attempt))
    }
  }

  throw new Error(`Failed to fetch Notion page after ${NOTION_MAX_ATTEMPTS} attempts.`)
}

const getUsersWithRetry = async (
  userIds: string[]
): Promise<Record<string, unknown> | null> => {
  for (let attempt = 0; attempt < NOTION_MAX_ATTEMPTS; attempt += 1) {
    try {
      const resp: any = await withNetworkLock(() =>
        (notion as any).getUsers(userIds)
      )
      return resp?.recordMapWithRoles?.notion_user ?? null
    } catch (error) {
      if (!isRetryableNotionError(error) || attempt === NOTION_MAX_ATTEMPTS - 1) {
        return null
      }
      await sleep(retryDelayMs(attempt))
    }
  }

  return null
}

// 컬렉션(=글 DB) 한 번에 가져오는 최대 행 수.
// notion-client 의 reducer 기본값은 999 이지만, 비공식 API 에는 cursor 기반
// 페이지네이션이 노출돼 있지 않으므로 글이 늘어나도 누락되지 않도록 명시적으로
// 넉넉히 올려둡니다. (react-notion-x / morethan-log 도 동일하게 limit 을 키우는 방식)
export const COLLECTION_FETCH_LIMIT = 10000

// 빌드 안정성:
//   - 5xx / 네트워크 오류 시 자동 재시도 (1s, 2s, 4s)
//   - 컬렉션 쿼리 에러는 silently swallow 하지 않고 throw → 재시도 트리거
//   - collectionReducerLimit 로 글 목록 누락 방지 (위 상수 참고)
const DEFAULT_FETCH_OPTIONS = {
  throwOnCollectionErrors: true,
  collectionReducerLimit: COLLECTION_FETCH_LIMIT,
  ofetchOptions: {
    retry: 3,
    retryDelay: 1000,
    retryStatusCodes: [408, 500, 502, 503, 504],
  },
} as const

export const fetchPage = (pageId: string): Promise<ExtendedRecordMap> => {
  const key = pageId.trim()
  if (!key) return Promise.reject(new Error("Notion page id is empty."))

  const cached = notionCache.pages.get(key)
  if (cached?.promise) return cached.promise
  if (cached?.value) return Promise.resolve(cached.value)
  if (
    cached?.error &&
    cached.errorAt &&
    Date.now() - cached.errorAt < ERROR_COOLDOWN_MS
  ) {
    return readDiskPageCache(key).then((recordMap) => {
      if (recordMap) {
        notionCache.pages.set(key, {
          promise: Promise.resolve(recordMap),
          value: recordMap,
        })
        return recordMap
      }
      return Promise.reject(cached.error)
    })
  }

  const promise = readDiskPageCache(key)
    .then((diskRecordMap) => diskRecordMap || getPageWithRetry(key))
    .then((recordMap) => {
      void writeDiskPageCache(key, recordMap)
      notionCache.pages.set(key, {
        promise: Promise.resolve(recordMap),
        value: recordMap,
      })
      return recordMap
    })
    .catch(async (error) => {
      const recordMap = await readDiskPageCache(key)
      if (recordMap) {
        notionCache.pages.set(key, {
          promise: Promise.resolve(recordMap),
          value: recordMap,
        })
        return recordMap
      }
      notionCache.pages.set(key, { error, errorAt: Date.now() })
      throw error
    })

  notionCache.pages.set(key, { promise })
  return promise
}

// 공개 게시 페이지의 recordMap 에는 notion_user 가 비어있어 별도 fetch 가 필요합니다.
// 응답 형태: { recordMapWithRoles: { notion_user: { [id]: { value: { value: User } } } } }
export const fetchUsers = async (
  userIds: string[]
): Promise<Record<string, unknown> | null> => {
  const uniqueUserIds = [...new Set(userIds)].sort()
  if (uniqueUserIds.length === 0) return null

  const key = uniqueUserIds.join(",")
  const cached = notionCache.users.get(key)
  if (cached) return cached.promise

  const promise = (async () => {
    return getUsersWithRetry(uniqueUserIds)
  })()

  notionCache.users.set(key, { promise })
  return promise
}
