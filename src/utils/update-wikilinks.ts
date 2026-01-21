/**
 * Replace wikilink IDs matching oldId with newId.
 * Supports standard links ([[id]] / [[id|label]]) and embeds (![[id]] / ![[id|label]]).
 */
export function updateWikilinks({
  fileContent,
  oldId,
  newId,
}: {
  fileContent: string
  oldId: string
  newId: string
}): string {
  if (!oldId || oldId === newId) return fileContent

  return fileContent.replace(WIKILINK_REGEX, (match, prefix, id, label) => {
    if (id !== oldId) return match
    return `${prefix}${newId}${label ?? ""}]]`
  })
}

const WIKILINK_REGEX = /(!?\[\[)([^\]|]+)(\|[^\]]+)?\]\]/g
