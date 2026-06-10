import dynamic from "next/dynamic"
import type { CodeBlock, Decoration, ExtendedRecordMap } from "notion-types"
import { NotionRenderer } from "react-notion-x"

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
    case "c++":
      return "cpp"
    case "f#":
      return "fsharp"
    default:
      return normalized.replace(/\s+/g, "-")
  }
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
  const caption = toPlainText(block.properties.caption)
  const classes = ["notion-code", `language-${language}`, className]
    .filter(Boolean)
    .join(" ")

  return (
    <>
      <pre className={classes} tabIndex={0}>
        <code className={`language-${language}`}>{content}</code>
      </pre>
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
