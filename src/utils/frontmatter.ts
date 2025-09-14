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
 * Updates, adds, or removes frontmatter properties to markdown content.
 * Properties with null values will be removed from the frontmatter.
 * If the content doesn't have frontmatter, it will be added with the specified properties.
 */
export function updateFrontmatter({
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
            const index = frontmatterLines.findIndex((line: string) => line.startsWith(`${key}:`))
            if (index !== -1) {
              frontmatterLines.splice(index, 1)
            }
            return
          }

          const propertyIndex = frontmatterLines.findIndex((line: string) =>
            line.startsWith(`${key}:`),
          )

          // Quote all string values with double quotes (YAML-compatible via JSON escaping)
          const formattedValue = typeof value === "string" ? JSON.stringify(value) : String(value)

          if (propertyIndex !== -1) {
            // If property already exists, update it
            frontmatterLines[propertyIndex] = `${key}: ${formattedValue}`
          } else {
            // If there's no property key, add it
            frontmatterLines.push(`${key}: ${formattedValue}`)
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
        return `${key}: ${formattedValue}`
      })
      .join("\n")

    return `---\n${frontmatterLines}\n---\n\n${content}`
  }
}
