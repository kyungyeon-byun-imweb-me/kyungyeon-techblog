import Link from "next/link"

type HomePaginationProps = {
  currentPage: number
  totalPages: number
}

const pageHref = (page: number): string => (page === 1 ? "/" : `/pages/${page}/`)

const getPageNumbers = (currentPage: number, totalPages: number): Array<number | "..."> => {
  const delta = 2
  const range: number[] = []
  const pages: Array<number | "..."> = []
  let last: number | null = null

  for (let page = 1; page <= totalPages; page += 1) {
    if (
      page === 1 ||
      page === totalPages ||
      (page >= currentPage - delta && page <= currentPage + delta)
    ) {
      range.push(page)
    }
  }

  for (const page of range) {
    if (last !== null) {
      if (page - last === 2) pages.push(last + 1)
      if (page - last > 2) pages.push("...")
    }
    pages.push(page)
    last = page
  }

  return pages
}

export default function HomePagination({
  currentPage,
  totalPages,
}: HomePaginationProps) {
  if (totalPages <= 1) return null

  const pages = getPageNumbers(currentPage, totalPages)

  return (
    <nav className="home-pagination" aria-label="글 목록 페이지">
      {currentPage > 1 && (
        <Link className="pagination-link pagination-edge" href={pageHref(currentPage - 1)}>
          Previous
        </Link>
      )}
      <div className="pagination-pages">
        {pages.map((page, index) =>
          page === "..." ? (
            <span key={`ellipsis-${index}`} className="pagination-ellipsis" aria-hidden>
              ...
            </span>
          ) : (
            <Link
              key={page}
              className={`pagination-link ${page === currentPage ? "active" : ""}`}
              href={pageHref(page)}
              aria-current={page === currentPage ? "page" : undefined}
            >
              {page}
            </Link>
          )
        )}
      </div>
      {currentPage < totalPages && (
        <Link className="pagination-link pagination-edge" href={pageHref(currentPage + 1)}>
          Next
        </Link>
      )}
    </nav>
  )
}
