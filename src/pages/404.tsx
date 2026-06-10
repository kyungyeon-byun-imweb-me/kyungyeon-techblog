import Link from "next/link"
import ModernLayout from "@/components/layout/ModernLayout"

export default function NotFoundPage() {
  return (
    <ModernLayout>
      <main className="article-container utility-page">
        <header className="article-meta-header">
          <h1 className="article-title">404</h1>
          <p className="article-excerpt">찾으시는 페이지가 없어요.</p>
        </header>
        <Link href="/" className="category-btn active">
          Back to Articles
        </Link>
      </main>
    </ModernLayout>
  )
}
