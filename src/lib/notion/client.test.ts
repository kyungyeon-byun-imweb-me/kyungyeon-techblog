import { afterEach, describe, expect, it, vi } from "vitest"
import { createNotionClient, NOTION_USER_AGENT } from "./client"

describe("createNotionClient", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("sends a User-Agent with Notion API requests", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ recordMap: { block: {} } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    )
    vi.stubGlobal("fetch", fetchMock)

    await createNotionClient().getPageRaw("00000000000000000000000000000000")

    expect(fetchMock).toHaveBeenCalledOnce()
    const [, options] = fetchMock.mock.calls[0]
    const headers = new Headers(options?.headers)
    expect(headers.get("user-agent")).toBe(NOTION_USER_AGENT)
  })
})
