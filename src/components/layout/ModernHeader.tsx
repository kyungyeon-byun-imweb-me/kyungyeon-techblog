import Link from "next/link"

const CONFIG = require("../../../site.config")

export default function ModernHeader() {
  return (
    <header className="modern-header">
      <div className="container">
        <div className="header-content">
          <div className="header-left">
            <Link href="/" className="logo" aria-label={CONFIG.blog.title}>
              <h1>{CONFIG.blog.title}</h1>
            </Link>
          </div>
          <nav className="header-nav" aria-label="주요 메뉴">
            {CONFIG.nav.map((item: { label: string; href: string; external?: boolean }) => (
              <Link
                key={item.href}
                href={item.href}
                className="nav-link"
                target={item.external ? "_blank" : undefined}
                rel={item.external ? "noreferrer" : undefined}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  )
}
