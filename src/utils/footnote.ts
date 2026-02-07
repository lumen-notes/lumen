export function getFootnoteContent(markdown: string, id: string): string | null {
  const prefix = `[^${id}]: `
  const startIdx = markdown.indexOf(prefix)
  if (startIdx === -1) return null

  const contentStart = startIdx + prefix.length
  const lines = markdown.slice(contentStart).split("\n")
  const result = [lines[0]]

  for (let i = 1; i < lines.length; i++) {
    if (lines[i].startsWith("    ")) {
      result.push(lines[i].slice(4))
    } else if (lines[i].trim() === "") {
      result.push("")
    } else {
      break
    }
  }

  return result.join("\n").trim() || null
}
