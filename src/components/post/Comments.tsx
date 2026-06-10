import Giscus from "@giscus/react"

const CONFIG = require("../../../site.config")

// GitHub Discussions 기반 댓글 (giscus).
// 설정이 비어있으면 아무것도 렌더링하지 않습니다.
// site.config.js 의 comments.giscus 참고.
export default function Comments() {
  const g = CONFIG.comments?.giscus
  if (!g?.enabled || !g.repoId || !g.categoryId) return null

  return (
    <section className="comments-section">
      <h2>Comments</h2>
      <Giscus
        repo={g.repo}
        repoId={g.repoId}
        category={g.category}
        categoryId={g.categoryId}
        mapping={g.mapping || "pathname"}
        strict="0"
        reactionsEnabled={g.reactionsEnabled || "1"}
        emitMetadata="0"
        inputPosition={g.inputPosition || "bottom"}
        theme="light"
        lang={g.lang || "ko"}
        loading="lazy"
      />
    </section>
  )
}
