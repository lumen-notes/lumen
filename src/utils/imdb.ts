const IMDB_TITLE_REGEX = /imdb\.com\/title\/(tt\d+)/

export function getImdbId(url: string | null): string | null {
  if (!url) return null
  const match = url.match(IMDB_TITLE_REGEX)
  return match ? match[1] : null
}
