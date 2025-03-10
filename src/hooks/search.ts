import { useAtomValue } from "jotai"
import React from "react"
import { noteSearcherAtom, sortedNotesAtom } from "../global-state"
import { Note } from "../schema"

type Qualifier = {
  key: string
  values: string[]
  exclude: boolean
}

type Query = {
  qualifiers: Qualifier[]
  fuzzy: string
}

export function useSearchNotes() {
  const sortedNotes = useAtomValue(sortedNotesAtom)
  const noteSearcher = useAtomValue(noteSearcherAtom)

  const searchNotes = React.useCallback(
    (query: string) => {
      // If there's no query, return all notes
      if (!query) return sortedNotes

      const { fuzzy, qualifiers } = parseQuery(query)
      const results = fuzzy ? noteSearcher.search(fuzzy) : sortedNotes
      return filterResults(results, qualifiers)
    },
    [sortedNotes, noteSearcher],
  )

  return searchNotes
}

// The same as useSearchNotes except the function value doesn't change when the notes change.
// This is useful for implementing note autocomplete in CodeMirror.
export function useStableSearchNotes() {
  const sortedNotes = useAtomValue(sortedNotesAtom)
  const noteSearcher = useAtomValue(noteSearcherAtom)

  const sortedNotesRef = React.useRef(sortedNotes)
  const noteSearcherRef = React.useRef(noteSearcher)

  React.useEffect(() => {
    sortedNotesRef.current = sortedNotes
  }, [sortedNotes])

  React.useEffect(() => {
    noteSearcherRef.current = noteSearcher
  }, [noteSearcher])

  const searchNotes = React.useCallback((query: string) => {
    // If there's no query, return all notes
    if (!query) return sortedNotesRef.current

    const { fuzzy, qualifiers } = parseQuery(query)
    const results = fuzzy ? noteSearcherRef.current.search(fuzzy) : sortedNotesRef.current
    return filterResults(results, qualifiers)
  }, [])

  return searchNotes
}

// eslint-disable-next-line no-useless-escape
const QUALIFIER_REGEX = /(?<exclude>-?)(?<key>\w+):(?<value>[^"\[\]| ]+|"[^"\[\]|]+")/g
// Valid qualifiers:
// - id:123
// - id:"hello, world"

export function parseQuery(query: string): Query {
  const fuzzy = query.replace(QUALIFIER_REGEX, "").trim()
  const matches = query.matchAll(QUALIFIER_REGEX)
  const qualifiers: Qualifier[] = Array.from(matches)
    .map((match) => {
      if (!match.groups) return null

      let values = []

      if (match.groups.value.startsWith('"')) {
        // If the value is quoted, remove the quotes
        values = [match.groups.value.slice(1, -1)]
      } else if (match.groups.value.includes(",")) {
        // If the value is comma-separated, split it into an array
        values = match.groups.value.split(",")
      } else {
        // Otherwise, just use the value as-is
        values = [match.groups.value]
      }

      return {
        key: match.groups.key,
        values,
        exclude: Boolean(match.groups.exclude),
      }
    })
    .filter(Boolean)

  return { fuzzy, qualifiers }
}

export function filterResults<T extends Note>(results: Array<T>, qualifiers: Qualifier[]) {
  return results.filter((item) => {
    if (!item) return false
    return testQualifiers(qualifiers, item)
  })
}

export function testQualifiers(qualifiers: Qualifier[], item: Note) {
  return qualifiers.every((qualifier) => {
    const frontmatter = item.frontmatter

    let value = false

    switch (qualifier.key) {
      case "id":
        // TODO: Add support for spaces in IDs
        // Match if the item's ID is in the qualifier's values
        value = qualifier.values.includes(item.id)
        break

      case "tag":
        // Match if any of the item's tags are in the qualifier's values
        value = item.tags.some((tag) => qualifier.values.includes(tag))
        break

      case "tags":
        // Match if the item's tag count is in the qualifier's value range
        value = qualifier.values.some((range) => isInRange(String(item.tags.length), range))
        break

      case "date":
        // Match if any of the item's dates are in the qualifier's value ranges
        value = item.dates.some((date) => {
          return qualifier.values.some((value) => isInRange(date, value))
        })
        break

      case "dates":
        // Match if the item's date count is in the qualifier's value range
        value = qualifier.values.some((range) => isInRange(item.dates.length, range))
        break

      case "link":
        // Match if any of the item's links are in the qualifier's values
        value = item.links.some((link) => qualifier.values.includes(link))
        break

      case "links":
        // Match if the item's link count is in the qualifier's value range
        value = qualifier.values.some((range) => isInRange(item.links.length, range))
        break

      case "backlink":
        if (!("backlinks" in item)) return false
        // Match if any of the item's backlinks are in the qualifier's values
        value = item.backlinks.some((backlink) => qualifier.values.includes(backlink))
        break

      case "backlinks":
        if (!("backlinks" in item)) return false
        // Match if the item's backlink count is in the qualifier's value range
        value = qualifier.values.some((value) => isInRange(item.backlinks.length, value))
        break

      case "tasks":
        value = qualifier.values.some((value) =>
          isInRange(item.tasks.filter((task) => !task.completed).length, value),
        )
        break

      case "no":
        // Match if the item doesn't have the specified property
        value = qualifier.values.some((value) => {
          switch (value) {
            case "backlinks":
              if (!("backlinks" in item)) return true
              return item.backlinks.length === 0
            case "tag":
            case "tags":
              return item.tags.length === 0
            case "date":
            case "dates":
              return item.dates.length === 0
            case "link":
            case "links":
              return item.links.length === 0
            case "task":
            case "tasks":
              return item.tasks.filter((task) => !task.completed).length === 0
            case "title":
              return !item.title
            default:
              return !(value in frontmatter)
          }
        })
        break

      case "has":
        // `has` is the opposite of `no`
        value = !qualifier.values.some((value) => {
          switch (value) {
            case "backlinks":
              if (!("backlinks" in item)) return false
              return item.backlinks.length === 0
            case "tag":
            case "tags":
              return item.tags.length === 0
            case "date":
            case "dates":
              return item.dates.length === 0
            case "link":
            case "links":
              return item.links.length === 0
            case "task":
            case "tasks":
              return item.tasks.filter((task) => !task.completed).length === 0
            case "title":
              return !item.title
            default:
              return !(value in frontmatter)
          }
        })
        break

      case "is":
      case "type":
        if (qualifier.values.includes("published")) {
          // Match if the item has a `gist_id` property (which means it's published)
          value =
            typeof item.frontmatter.gist_id === "string" && item.frontmatter.gist_id.length > 0
        } else {
          // Match if the item's type is in the qualifier's values
          value = qualifier.values.includes(item.type)
        }
        break

      default:
        if (qualifier.key in frontmatter) {
          // Match if the item's frontmatter value is in the qualifier's values
          value = qualifier.values.includes(String(frontmatter[qualifier.key]))
        }
        break
    }

    return qualifier.exclude ? !value : value
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
    return value.toString() === range
  }
}
