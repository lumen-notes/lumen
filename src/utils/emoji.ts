import emojiRegex from "emoji-regex"

export function getLeadingEmoji(str: string): string | null {
  const matches = [...str.matchAll(emojiRegex())]

  if (matches.length === 0 || matches[0].index > 0) {
    return null
  }

  return matches[0][0]
}

export function removeLeadingEmoji(str: string): string {
  const leadingEmoji = getLeadingEmoji(str)

  if (!leadingEmoji) {
    return str
  }

  return str.slice(leadingEmoji.length)
}
