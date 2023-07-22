/** Removes the template definition from the frontmatter of a note */
export function removeTemplateFrontmatter(rawBody: string) {
  const lines = rawBody.split("\n")
  // Start is the line that starts with "template:"
  const templateStart = lines.findIndex((line) => line.startsWith("template:"))
  // End is the first line that's not indented
  const templateEnd = lines.findIndex(
    (line, index) => index > templateStart && !line.startsWith(" "),
  )
  return lines.filter((_, index) => index < templateStart || index >= templateEnd).join("\n")
}
