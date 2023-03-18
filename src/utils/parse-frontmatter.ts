import { parse } from "yaml"

const FRONTMATTER_REGEX = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/

/** Parses frontmatter from a markdown string */
export function parseFrontmatter(markdown: string): {
  frontmatter?: Record<string, unknown>
  content: string
} {
  const match = markdown.match(FRONTMATTER_REGEX)

  if (!match) {
    return { content: markdown }
  }

  const [, frontmatterYaml, content] = match
  const frontmatter = parse(frontmatterYaml)

  return { frontmatter, content: content.trimStart() }
}
