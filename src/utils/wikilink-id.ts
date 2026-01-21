const WIKILINK_ID_REGEX = /^[0-9A-Za-z_.~!$&'()*+,;@{} -]+$/

export function isValidWikilinkId(id: string): boolean {
  if (!id) return false
  return WIKILINK_ID_REGEX.test(id)
}
