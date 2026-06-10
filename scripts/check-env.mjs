import { createRequire } from "node:module"

const require = createRequire(import.meta.url)
const { loadLocalEnv } = require("./load-env.cjs")

loadLocalEnv(process.cwd())

const hasNotionSource =
  process.env.NOTION_PAGE_ID?.trim() || process.env.NOTION_DATABASE_ID?.trim()

if (!hasNotionSource) {
  console.error(
    "[env] Missing required environment variable: NOTION_PAGE_ID or NOTION_DATABASE_ID"
  )
  console.error(
    "[env] Add it to .env.local for local builds, or GitHub Actions repository secrets for deploys."
  )
  process.exit(1)
}
