const CONFIG = require("../../../site.config")

export default function ModernFooter() {
  return (
    <footer className="modern-footer">
      <div className="container">
        <div className="footer-copyright">
          © {new Date().getFullYear()} {CONFIG.blog.title}. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
