import ModernLayout from "@/components/layout/ModernLayout"

const CONFIG = require("../../site.config")

export default function AboutPage() {
  return (
    <ModernLayout>
      <main className="article-container utility-page">
        <header className="article-meta-header">
          <h1 className="article-title">About</h1>
          <p className="article-excerpt">{CONFIG.blog.description}</p>
        </header>
        <div className="article-content">
          <p>
            Notion 데이터베이스에 글을 작성하고 공개 상태로 바꾸면 정적 빌드에 반영되는
            개인 기술 블로그입니다.
          </p>
          <p>
            문의는 <a href={`mailto:${CONFIG.social.contactEmail}`}>{CONFIG.social.contactEmail}</a> 로
            보내주세요.
          </p>
        </div>
      </main>
    </ModernLayout>
  )
}
