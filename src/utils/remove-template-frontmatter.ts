/** Removes the template definition from the frontmatter of a note */
export function removeTemplateFrontmatter(content: string) {
  const lines = content.split("\n")

  // Start is the line that starts with "template:"
  const templateStart = lines.findIndex((line) => line.startsWith("template:"))
  // End is the first line that's not indented
  const templateEnd = lines.findIndex(
    (line, index) => index > templateStart && !line.startsWith(" "),
  )

  const body = lines.filter((_, index) => index < templateStart || index >= templateEnd).join("\n")

  // Remove '---' if there's nothing else in the frontmatter
  return body.replace(/---[\s]*---[\s]*/, "")
}
