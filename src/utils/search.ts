import { parseDate } from "chrono-node"
import { toDateString } from "./date"

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
  if (["tags", "links", "backlinks", "updated_at"].includes(key)) return "desc"
  return "asc"
}

/**
 * Resolves relative date strings (today, tomorrow, yesterday, etc.) to ISO format.
 * Returns original string if not a parseable date.
 */
export function resolveRelativeDate(value: string): string {
  // Replace + with space to support date:next+week syntax
  const normalized = value.replace(/\+/g, " ")
  const date = parseDate(normalized)
  if (date) {
    return toDateString(date)
  }
  return value
}

export function isInRange(value: string | number, range: string): boolean {
  if (range.startsWith(">=")) {
    return value >= resolveRelativeDate(range.slice(2))
  } else if (range.startsWith("<=")) {
    return value <= resolveRelativeDate(range.slice(2))
  } else if (range.startsWith(">")) {
    return value > resolveRelativeDate(range.slice(1))
  } else if (range.startsWith("<")) {
    return value < resolveRelativeDate(range.slice(1))
  } else {
    return value.toString() === resolveRelativeDate(range)
  }
}
