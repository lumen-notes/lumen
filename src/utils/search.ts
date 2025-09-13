import type { Note } from "../schema"

export type Filter = {
  key: string
  values: string[]
  exclude: boolean
}

export type SortDirection = "asc" | "desc"

export type Sort = {
  key: string
  direction: SortDirection
}

export type Query = {
  filters: Filter[]
  fuzzy: string
  sorts: Sort[]
}

// eslint-disable-next-line no-useless-escape
const QUALIFIER_REGEX = /(?<exclude>-?)(?<key>[-\w]+):(?<value>[^"\[\]| ]+|"[^"\[\]|]+")/g

export function parseQuery(query: string): Query {
  const sorts: Sort[] = []
  const filters: Filter[] = []

  const matches = Array.from(query.matchAll(QUALIFIER_REGEX))

  for (const match of matches) {
    if (!match.groups) continue

    const key = match.groups.key
    const value = match.groups.value
    const exclude = Boolean(match.groups.exclude)

    if (key === "sort") {
      const values = value.split(",")

      for (const sort of values) {
        const [key, direction] = sort.trim().split(":")

        sorts.push({
          key,
          direction: getSortDirection(key, direction),
        })
      }

      continue
    }

    let values = [] as string[]
    if (value.startsWith('"')) {
      values = [value.slice(1, -1)]
    } else if (value.includes(",")) {
      values = value
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean)
    } else {
      values = [value.trim()]
    }

    filters.push({ key, values, exclude })
  }

  const fuzzy = query.replace(QUALIFIER_REGEX, "").trim()

  return { fuzzy, filters, sorts }
}

function getSortDirection(key: string, direction?: string): SortDirection {
  if (direction === "asc") return "asc"
  if (direction === "desc") return "desc"
  if (["tags", "links", "backlinks"].includes(key)) return "desc"
  return "asc"
}

export function filterNotes(results: Array<Note>, filters: Filter[]) {
  return results.filter((note) => {
    if (!note) return false
    return testFilters(filters, note)
  })
}

export function testFilters(filters: Filter[], note: Note) {
  return filters.every((filter) => testFilter(filter, note))
}

export function testFilter(filter: Filter, note: Note) {
  const frontmatter = note.frontmatter

  let value = false

  switch (filter.key) {
    case "id":
      value = filter.values.includes(note.id)
      break
    case "title":
      value = filter.values.includes(note.title)
      break
    case "tag":
      value = note.tags.some((tag) => filter.values.includes(tag))
      break
    case "tags":
      value = filter.values.some((range) => isInRange(String(note.tags.length), range))
      break
    case "date":
      value = note.dates.some((date) => {
        return filter.values.some((value) => isInRange(date, value))
      })
      break
    case "dates":
      value = filter.values.some((range) => isInRange(note.dates.length, range))
      break
    case "link":
      value = note.links.some((link) => filter.values.includes(link))
      break
    case "links":
      value = filter.values.some((range) => isInRange(note.links.length, range))
      break
    case "backlink":
      if (!("backlinks" in note)) return false
      value = note.backlinks.some((backlink) => filter.values.includes(backlink))
      break
    case "backlinks":
      if (!("backlinks" in note)) return false
      value = filter.values.some((value) => isInRange(note.backlinks.length, value))
      break
    case "tasks":
      value = filter.values.some((value) =>
        isInRange(note.tasks.filter((task) => !task.completed).length, value),
      )
      break
    case "no":
      value = filter.values.some((value) => {
        switch (value) {
          case "backlink":
          case "backlinks":
            return !("backlinks" in note) || note.backlinks.length === 0
          case "tag":
          case "tags":
            return note.tags.length === 0
          case "date":
          case "dates":
            return note.dates.length === 0
          case "link":
          case "links":
            return note.links.length === 0
          case "task":
          case "tasks":
            return note.tasks.filter((task) => !task.completed).length === 0
          case "title":
            return !note.title
          default:
            return !(value in frontmatter)
        }
      })
      break
    case "has":
      value = filter.values.some((value) => {
        switch (value) {
          case "backlink":
          case "backlinks":
            return "backlinks" in note && note.backlinks.length > 0
          case "tag":
          case "tags":
            return note.tags.length > 0
          case "date":
          case "dates":
            return note.dates.length > 0
          case "link":
          case "links":
            return note.links.length > 0
          case "task":
          case "tasks":
            return note.tasks.filter((task) => !task.completed).length > 0
          case "title":
            return Boolean(note.title)
          default:
            return value in frontmatter
        }
      })
      break
    case "type":
      value = filter.values.includes(note.type)
      break
    default:
      if (filter.key in frontmatter) {
        value = filter.values.includes(String(frontmatter[filter.key]))
      }
      break
  }

  return filter.exclude ? !value : value
}

export function sortNotes(results: Array<Note>, sorts: Sort[]): Array<Note> {
  return [...results].sort((a, b) => compareNotes(a, b, sorts))
}

const collator = new Intl.Collator(undefined, {
  sensitivity: "base",
  numeric: true,
  ignorePunctuation: true,
})

function compareNotes(a: Note, b: Note, sorts: Sort[]) {
  for (const sort of sorts) {
    let compareResult = 0

    switch (sort.key) {
      case "id": {
        compareResult = collator.compare(a.id, b.id)
        break
      }
      case "title": {
        compareResult = collator.compare(a.displayName, b.displayName)
        break
      }
      case "tags": {
        const aTagCount = a.tags.length
        const bTagCount = b.tags.length
        compareResult = aTagCount - bTagCount
        break
      }
      case "links": {
        const aLinkCount = a.links.length
        const bLinkCount = b.links.length
        compareResult = aLinkCount - bLinkCount
        break
      }
      case "backlinks": {
        const aBacklinkCount = "backlinks" in a ? a.backlinks.length : 0
        const bBacklinkCount = "backlinks" in b ? b.backlinks.length : 0
        compareResult = aBacklinkCount - bBacklinkCount
        break
      }
      default: {
        continue
      }
    }

    if (compareResult !== 0) {
      return sort.direction === "desc" ? -compareResult : compareResult
    }
  }

  return 0
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
