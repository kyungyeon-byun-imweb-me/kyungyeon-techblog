import { useEffect, useRef } from "react"

const CONFIG = require("../../../site.config")

export default function Comments() {
  const containerRef = useRef<HTMLDivElement>(null)
  const config = CONFIG.comments?.utterances

  useEffect(() => {
    const container = containerRef.current
    if (!container || !config?.enabled || !config.repo) return
    if (container.dataset.utterancesLoaded === "true") return

    container.dataset.utterancesLoaded = "true"

    const utterances = document.createElement("script")
    const attributes = {
      src: "https://utteranc.es/client.js",
      repo: config.repo,
      branch: config.branch || "master",
      "issue-term": config.issueTerm || "url",
      theme: config.theme || "github-light",
      crossorigin: "anonymous",
      async: "true",
    }

    Object.entries(attributes).forEach(([key, value]) => {
      utterances.setAttribute(key, value)
    })

    container.appendChild(utterances)
  }, [config?.branch, config?.enabled, config?.issueTerm, config?.repo, config?.theme])

  if (!config?.enabled || !config.repo) return null

  return (
    <section className="comments-section" aria-label="Comments">
      <div ref={containerRef} id="comment" />
    </section>
  )
}
