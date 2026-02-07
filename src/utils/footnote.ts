import { normalizeIdentifier } from "micromark-util-normalize-identifier"
import { normalizeUri } from "micromark-util-sanitize-uri"

const FOOTNOTE_DEFINITION_REGEX = /^[ \t]{0,3}\[\^([^\]]+)\]:[ \t]*(.*)$/

function normalizeFootnoteId(id: string) {
  return normalizeUri(normalizeIdentifier(id).toLowerCase())
}

export function getFootnoteContent(markdown: string, id: string): string | null {
  const targetId = normalizeFootnoteId(id)
  const lines = markdown.split("\n")

  for (let i = 0; i < lines.length; i += 1) {
    const match = lines[i].match(FOOTNOTE_DEFINITION_REGEX)
    if (!match) continue

    const definitionId = match[1]
    if (normalizeFootnoteId(definitionId) !== targetId) continue

    const result: string[] = [match[2] ?? ""]

    for (let j = i + 1; j < lines.length; j += 1) {
      const line = lines[j]
      if (line.startsWith("    ")) {
        result.push(line.slice(4))
      } else if (line.startsWith("\t")) {
        result.push(line.slice(1))
      } else if (line.trim() === "") {
        result.push("")
      } else {
        break
      }
    }

    return result.join("\n").trim() || null
  }

  return null
}
