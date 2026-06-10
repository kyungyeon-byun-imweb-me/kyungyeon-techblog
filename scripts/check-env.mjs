import { createRequire } from "node:module"

const require = createRequire(import.meta.url)
const { loadLocalEnv } = require("./load-env.cjs")

loadLocalEnv(process.cwd())

const requiredEnv = ["NOTION_DATABASE_ID"]

const missing = requiredEnv.filter((name) => !process.env[name]?.trim())

if (missing.length > 0) {
  console.error(
    `[env] Missing required environment variable: ${missing.join(", ")}`
  )
  console.error(
    "[env] Add it to .env.local for local builds, or GitHub Actions repository secrets for deploys."
  )
  process.exit(1)
}
