import yaml from "yamljs"

const FRONTMATTER_REGEX = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/

/** Parses frontmatter from a markdown string */
export function parseFrontmatter(markdown: string): {
  frontmatter: Record<string, unknown>
  content: string
} {
  try {
    const match = markdown.match(FRONTMATTER_REGEX)

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
