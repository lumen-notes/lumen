import { useAtomValue } from "jotai"
import React from "react"
import { noteSearcherAtom, sortedNoteEntriesAtom } from "../global-atoms"
import { Note } from "../types"

type Qualifier = {
  key: string
  values: string[]
  exclude: boolean
}

type Query = {
  qualifiers: Qualifier[]
  fuzzy: string
}

export const useSearchNotes = () => {
  const sortedNoteEntries = useAtomValue(sortedNoteEntriesAtom)
  const noteSearcher = useAtomValue(noteSearcherAtom)

  const searchNotes = React.useCallback(
    (query: string) => {
      // If there's no query, return all notes
      if (!query) return sortedNoteEntries

      const { fuzzy, qualifiers } = parseQuery(query)
      const results = fuzzy ? noteSearcher.search(fuzzy) : sortedNoteEntries
      return filterResults(results, qualifiers)
    },
    [sortedNoteEntries, noteSearcher],
  )

  return searchNotes
}

const QUALIFIER_REGEX = /(?<exclude>-?)(?<key>\w+):(?<value>[\w-,><=/]+)/g

export function parseQuery(query: string): Query {
  const fuzzy = query.replace(QUALIFIER_REGEX, "").trim()
  const matches = query.matchAll(QUALIFIER_REGEX)
  const qualifiers: Qualifier[] = Array.from(matches)
    .map((match) => {
      if (!match.groups) return null

      return {
        key: match.groups.key,
        values: match.groups.value.split(","),
        exclude: Boolean(match.groups.exclude),
      }
    })
    .filter(Boolean)

  return { fuzzy, qualifiers }
}

export function filterResults(results: Array<[string, Note]>, qualifiers: Qualifier[]) {
  return results.filter(([id, note]) => {
    if (!note) return false
    return qualifiers.every((qualifier) => {
      let value = false

      switch (qualifier.key) {
        case "id":
          // Match if the note's ID is in the qualifier's values
          value = qualifier.values.includes(id)
          break

        case "tag":
          // Match if any of the note's tags are in the qualifier's values
          value = note.tags.some((tag) => qualifier.values.includes(tag))
          break

        case "tags":
          // Match if the note's tag count is in the qualifier's value range
          value = qualifier.values.some((range) => isInRange(String(note.tags.length), range))
          break

        case "date":
          // Match if any of the note's dates are in the qualifier's value ranges
          value = note.dates.some((date) => {
            return qualifier.values.some((value) => isInRange(date, value))
          })
          break

        case "dates":
          // Match if the note's date count is in the qualifier's value range
          value = qualifier.values.some((range) => isInRange(note.dates.length, range))
          break

        case "link":
          // Match if any of the note's links are in the qualifier's values
          value = note.links.some((link) => qualifier.values.includes(link))
          break

        case "links":
          // Match if the note's link count is in the qualifier's value range
          value = qualifier.values.some((range) => isInRange(note.links.length, range))
          break

        case "backlink":
          // Match if any of the note's backlinks are in the qualifier's values
          value = note.backlinks.some((backlink) => qualifier.values.includes(backlink))
          break

        case "backlinks":
          // Match if the note's backlink count is in the qualifier's value range
          value = qualifier.values.some((value) => isInRange(note.backlinks.length, value))
          break

        case "no":
          // Match if the note doesn't have the specified property
          value = qualifier.values.some((value) => {
            switch (value) {
              case "backlinks":
                return note.backlinks.length === 0
              case "tag":
              case "tags":
                return note.tags.length === 0
              case "date":
              case "dates":
                return note.dates.length === 0
              case "link":
              case "links":
                return note.links.length === 0
              default:
                return !(value in note.frontmatter)
            }
          })
          break

        default:
          if (qualifier.key in note.frontmatter) {
            // Match if the note's frontmatter value is in the qualifier's values
            value = qualifier.values.includes(String(note.frontmatter[qualifier.key]))
          }
          break
      }

      return qualifier.exclude ? !value : value
    })
  })
}

function isInRange(value: string | number, range: string) {
  if (range.startsWith(">=")) {
    return value >= range.slice(2)
  } else if (range.startsWith("<=")) {
    return value <= range.slice(2)
  } else if (range.startsWith(">")) {
    return value > range.slice(1)
  } else if (range.startsWith("<")) {
    return value < range.slice(1)
  } else {
    return value === range
  }
}
