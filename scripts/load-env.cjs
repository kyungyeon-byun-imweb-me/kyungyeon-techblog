const { existsSync, readFileSync } = require("node:fs")
const { join } = require("node:path")

const ENV_FILES = [".env.local", ".env"]

function stripQuotes(value) {
  const trimmed = value.trim()
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1)
  }
  return trimmed
}

function loadLocalEnv(cwd = process.cwd()) {
  for (const file of ENV_FILES) {
    const path = join(cwd, file)
    if (!existsSync(path)) continue

    const lines = readFileSync(path, "utf8").split(/\r?\n/)
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith("#")) continue

      const normalized = trimmed.startsWith("export ")
        ? trimmed.slice("export ".length).trim()
        : trimmed
      const equalsIndex = normalized.indexOf("=")
      if (equalsIndex === -1) continue

      const key = normalized.slice(0, equalsIndex).trim()
      const value = stripQuotes(normalized.slice(equalsIndex + 1))
      if (!key || process.env[key] !== undefined) continue

      process.env[key] = value
    }
  }
}

module.exports = { loadLocalEnv }
