import dynamic from "next/dynamic"
import type { ExtendedRecordMap } from "notion-types"
import { NotionRenderer } from "react-notion-x"

const Code = dynamic(() =>
  import("react-notion-x/build/third-party/code").then((m) => m.Code)
)
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
          Code,
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
