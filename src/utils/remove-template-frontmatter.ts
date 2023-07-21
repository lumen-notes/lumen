import { parseFrontmatter } from "./parse-frontmatter"
import yaml from "yamljs"

export function removeTemplateFrontmatter(rawBody: string) {
  const { frontmatter, content } = parseFrontmatter(rawBody)
  const { template: _, ...frontmatterWithoutTemplate } = frontmatter
  const frontmatterString = yaml
    .stringify(frontmatterWithoutTemplate)
    .replace(/\n$/g, "")
    .replace(/null/g, "")
  return frontmatterString !== "{}" ? `---\n${frontmatterString}\n---\n\n${content}` : content
}
