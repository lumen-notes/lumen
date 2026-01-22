const NOTE_ID_REGEX = /^[0-9A-Za-z_.~!$&'()*+,;@{} /-]+$/

export function isValidNoteId(id: string): boolean {
  if (!id) return false
  return NOTE_ID_REGEX.test(id)
}

export function generateNoteId(): string {
  return Date.now().toString()
}

export function getInvalidNoteIdCharacters(id: string): string[] {
  if (!id) return []

  return Array.from(id).filter((char) => !NOTE_ID_REGEX.test(char))
}
