import { useState } from "react"
import type { TPost } from "@/types"

export default function PostActions({ post }: { post: TPost }) {
  const [copied, setCopied] = useState(false)

  const share = async () => {
    const url = typeof window !== "undefined" ? window.location.href : ""
    const data = { title: post.title, text: post.summary, url }

    try {
      if (navigator.share) {
        await navigator.share(data)
        return
      }
    } catch {
      return
    }

    if (navigator.clipboard && url) {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    }
  }

  return (
    <footer className="article-footer">
      <div className="article-actions-bar">
        <div className="action-buttons-group">
          <button type="button" onClick={share}>
            <span className="icon" aria-hidden>
              🔗
            </span>
            {copied ? "Copied" : "Share"}
          </button>
        </div>
      </div>
    </footer>
  )
}
