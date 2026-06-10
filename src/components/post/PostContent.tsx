import dynamic from "next/dynamic"
import type { CodeBlock, Decoration, ExtendedRecordMap } from "notion-types"
import { useState } from "react"
import { NotionRenderer } from "react-notion-x"

const Prism = require("prismjs")
require("prismjs/components/prism-bash")
require("prismjs/components/prism-css")
require("prismjs/components/prism-json")
require("prismjs/components/prism-jsx")
require("prismjs/components/prism-markup")
require("prismjs/components/prism-sql")
require("prismjs/components/prism-typescript")
require("prismjs/components/prism-tsx")

const Collection = dynamic(() =>
  import("react-notion-x/build/third-party/collection").then((m) => m.Collection)
)
const Equation = dynamic(() =>
  import("react-notion-x/build/third-party/equation").then((m) => m.Equation)
)
const Modal = dynamic(
  () => import("react-notion-x/build/third-party/modal").then((m) => m.Modal),
  { ssr: false }
)

const toPlainText = (value?: Decoration[]) =>
  value?.map(([text]) => text).join("") ?? ""

const normalizeLanguage = (language: string) => {
  const normalized = language.trim().toLowerCase() || "plain text"

  switch (normalized) {
    case "js":
      return "javascript"
    case "ts":
      return "typescript"
    case "shell":
    case "sh":
    case "zsh":
      return "bash"
    case "postgres":
    case "postgresql":
    case "mysql":
      return "sql"
    case "c++":
      return "cpp"
    case "f#":
      return "fsharp"
    default:
      return normalized.replace(/\s+/g, "-")
  }
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")

const highlightCode = (content: string, language: string) => {
  const grammar = Prism.languages[language]
  if (!grammar) return escapeHtml(content)
  return Prism.highlight(content, grammar, language)
}

function PlainCode({
  block,
  className,
}: {
  block: CodeBlock
  defaultLanguage?: string
  className?: string
}) {
  const content = toPlainText(block.properties.title)
  const language = normalizeLanguage(toPlainText(block.properties.language))
  const highlighted = highlightCode(content, language)
  const caption = toPlainText(block.properties.caption)
  const classes = ["notion-code", `language-${language}`, className]
    .filter(Boolean)
    .join(" ")
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    if (!content) return

    try {
      await navigator.clipboard.writeText(content)
    } catch {
      const textarea = document.createElement("textarea")
      textarea.value = content
      textarea.setAttribute("readonly", "")
      textarea.style.position = "fixed"
      textarea.style.opacity = "0"
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand("copy")
      textarea.remove()
    }

    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  return (
    <>
      <div className="notion-code-wrapper gatsby-remark-prismjs-copy-button-container">
        <button
          type="button"
          className="code-copy-button gatsby-remark-prismjs-copy-button"
          onClick={copy}
          aria-label="코드 복사"
        >
          {copied ? "Copied" : "Copy"}
        </button>
        <pre className={classes} tabIndex={0}>
          <code
            className={`language-${language}`}
            dangerouslySetInnerHTML={{ __html: highlighted }}
          />
        </pre>
      </div>
      {caption && <figcaption className="notion-asset-caption">{caption}</figcaption>}
    </>
  )
}

export default function PostContent({
  recordMap,
}: {
  recordMap: ExtendedRecordMap
}) {
  return (
    <div className="article-content notion-article-content">
      <NotionRenderer
        recordMap={recordMap}
        fullPage={false}
        darkMode={false}
        components={{
          Code: PlainCode,
          Collection,
          Equation,
          Modal,
          Property: () => null,
          nextImage: undefined,
          nextLink: undefined,
        }}
      />
    </div>
  )
}
