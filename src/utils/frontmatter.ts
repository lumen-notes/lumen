import yaml from "yamljs"

/** Parses frontmatter from a markdown string */
export function parseFrontmatter(markdown: string): {
  frontmatter: Record<string, unknown>
  content: string
} {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/

  try {
    const match = markdown.match(frontmatterRegex)

    if (!match) {
      return { frontmatter: {}, content: markdown }
    }

    const [, frontmatterYaml, content] = match
    const frontmatter = yaml.parse(frontmatterYaml)

    if (!frontmatter) {
      return { frontmatter: {}, content: markdown }
    }

    return { frontmatter, content: content.trimStart() }
  } catch (error) {
    console.error("Error parsing frontmatter", error)
    return { frontmatter: {}, content: markdown }
  }
}

/**
 * Returns a YAML-safe key representation, quoting when necessary.
 */
function serializeYamlKey(key: string): string {
  const isSafe = /^[A-Za-z_][A-Za-z0-9_-]*$/.test(key)
  return isSafe ? key : JSON.stringify(key)
}

/** Extracts the key from a YAML key/value line. Returns null if not a key/value line */
function extractKeyFromLine(line: string): string | null {
  const match = line.match(/^\s*(?:"([^"]*)"|'([^']*)'|([^:\s][^:]*?))\s*:/)
  if (!match) return null
  return match[1] ?? match[2] ?? (match[3] ? match[3].trim() : null)
}

function findKeyLineIndex(lines: string[], key: string): number {
  for (let i = 0; i < lines.length; i += 1) {
    const k = extractKeyFromLine(lines[i])
    if (k === key) return i
  }
  return -1
}

/** Splits a YAML key/value line into key and the remainder after the key/value colon */
function splitYamlKeyValue(line: string): { key: string; afterColon: string } | null {
  const match = line.match(/^\s*(?:"([^"]*)"|'([^']*)'|([^:\s][^:]*?))\s*:(.*)$/)
  if (!match) return null
  const key = match[1] ?? match[2] ?? (match[3] ? match[3].trim() : "")
  const afterColon = match[4] ?? ""
  return { key, afterColon }
}

/**
 * Updates, adds, or removes frontmatter values to markdown content.
 * Properties with null values will be removed from the frontmatter.
 * If the content doesn't have frontmatter, it will be added with the specified properties.
 */
export function updateFrontmatterValue({
  content,
  properties,
}: {
  content: string
  properties: Record<string, unknown>
}): string {
  // Define a regular expression to match the frontmatter block
  const frontmatterRegex = /^---\n([\s\S]*?)\n---/

  // Check if the content contains a frontmatter block
  if (frontmatterRegex.test(content)) {
    return content
      .replace(frontmatterRegex, (frontmatterBlock, frontmatterContent) => {
        const frontmatterLines = frontmatterContent.split("\n")

        // Process each property to update or add
        Object.entries(properties).forEach(([key, value]) => {
          // Skip null values (used to remove properties)
          if (value === null) {
            const index = findKeyLineIndex(frontmatterLines, key)
            if (index !== -1) {
              frontmatterLines.splice(index, 1)
            }
            return
          }

          const propertyIndex = findKeyLineIndex(frontmatterLines, key)

          // Quote all string values with double quotes (YAML-compatible via JSON escaping)
          const formattedValue = typeof value === "string" ? JSON.stringify(value) : String(value)

          if (propertyIndex !== -1) {
            // If property already exists, update it
            // Preserve the spacing after the colon if present
            const line = frontmatterLines[propertyIndex]
            const split = splitYamlKeyValue(line)
            const afterColon = split ? split.afterColon : ""
            const spacing =
              afterColon.length > 0 && /^\s+/.test(afterColon) ? afterColon.match(/^\s+/)![0] : " "
            frontmatterLines[propertyIndex] = `${serializeYamlKey(key)}:${spacing}${formattedValue}`
          } else {
            // If there's no property key, add it
            frontmatterLines.push(`${serializeYamlKey(key)}: ${formattedValue}`)
          }
        })

        // If there's no frontmatter content, remove the frontmatter block
        if (frontmatterLines.length === 0) {
          return ""
        }

        return `---\n${frontmatterLines.join("\n")}\n---`
      })
      .trimStart()
  } else {
    // If there's no frontmatter, add it with the properties
    const frontmatterLines = Object.entries(properties)
      .filter(([_, value]) => value !== null)
      .map(([key, value]) => {
        const formattedValue = typeof value === "string" ? JSON.stringify(value) : String(value)
        return `${serializeYamlKey(key)}: ${formattedValue}`
      })
      .join("\n")

    return `---\n${frontmatterLines}\n---\n\n${content}`
  }
}

/**
 * Renames a frontmatter key, preserving the existing value formatting.
 * If the new key already exists, its value will be replaced
 * with the old key's value, and the old key will be removed.
 */
export function updateFrontmatterKey({
  content,
  oldKey,
  newKey,
}: {
  content: string
  oldKey: string
  newKey: string
}): string {
  const trimmedNewKey = newKey.trim()
  if (!trimmedNewKey || trimmedNewKey === oldKey) return content

  const frontmatterRegex = /^---\n([\s\S]*?)\n---/
  if (!frontmatterRegex.test(content)) return content

  return content.replace(frontmatterRegex, (frontmatterBlock, frontmatterContent) => {
    const lines = frontmatterContent.split("\n")
    const oldIndex = findKeyLineIndex(lines, oldKey)
    if (oldIndex === -1) return frontmatterBlock

    // Split the source line on the first colon to preserve spacing after it
    const line = lines[oldIndex]
    const split = splitYamlKeyValue(line)
    const afterColon = split ? split.afterColon : ""
    // Build a set of existing keys to check for collisions
    const existingKeys = new Set<string>()
    for (let i = 0; i < lines.length; i += 1) {
      const k = extractKeyFromLine(lines[i])
      if (k !== null) existingKeys.add(k)
    }

    const isTaken = (candidate: string) => existingKeys.has(candidate) && candidate !== oldKey

    // Resolve collisions by appending a numeric suffix 1,2,3,...
    let finalNewKey = trimmedNewKey
    if (isTaken(finalNewKey)) {
      let suffix = 1
      let candidate = `${trimmedNewKey}${suffix}`
      while (isTaken(candidate)) {
        suffix += 1
        candidate = `${trimmedNewKey}${suffix}`
      }
      finalNewKey = candidate
    }

    const newLine = `${serializeYamlKey(finalNewKey)}:${afterColon}`
    // Replace only the old key line; keep any existing keys intact
    lines[oldIndex] = newLine

    // If there are no lines left, remove the entire frontmatter
    if (lines.length === 0) return ""

    return `---\n${lines.join("\n")}\n---`
  })
}
