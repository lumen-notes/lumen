import { addDays, formatDistance, isSameDay, subDays } from "date-fns"

// Date utilities

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

export const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
]

/**
 * Formats a date string
 *
 * @example
 * formatDate("1998-07-11") // "Tue, Jul 11 1998"
 */
export function formatDate(
  dateString: string,
  { excludeDayOfWeek = false }: { excludeDayOfWeek?: boolean } = {},
) {
  const date = new Date(dateString)
  const currentYear = new Date().getUTCFullYear()
  const year = date.getUTCFullYear()
  const month = MONTH_NAMES[date.getUTCMonth()].slice(0, 3)
  const day = date.getUTCDate()

  let formattedDate = `${month} ${day}`

  if (!excludeDayOfWeek) {
    const dayOfWeek = DAY_NAMES[date.getUTCDay()].slice(0, 3)
    formattedDate = `${dayOfWeek}, ${formattedDate}`
  }

  // Only show the year if it's not the current year
  if (year !== currentYear) {
    formattedDate += `, ${year}`
  }

  return formattedDate
}

export function formatDateDistance(dateString: string) {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()
  const currentDay = now.getDate()

  const nowUtc = new Date(Date.UTC(currentYear, currentMonth, currentDay))

  const then = new Date(dateString)

  // Is today?
  if (isSameDay(nowUtc, then)) {
    return "Today"
  }

  // Is tomorrow?
  if (isSameDay(addDays(nowUtc, 1), then)) {
    return "Tomorrow"
  }

  // Is yesterday?
  if (isSameDay(subDays(nowUtc, 1), then)) {
    return "Yesterday"
  }

  return formatDistance(then, nowUtc, {
    addSuffix: true,
  })
}

export function toDateString(date: Date) {
  const year = date.getFullYear().toString().padStart(4, "0")
  const month = (date.getMonth() + 1).toString().padStart(2, "0")
  const day = date.getDate().toString().padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function toDateStringUtc(date: Date) {
  const year = date.getUTCFullYear().toString().padStart(4, "0")
  const month = (date.getUTCMonth() + 1).toString().padStart(2, "0")
  const day = date.getUTCDate().toString().padStart(2, "0")
  return `${year}-${month}-${day}`
}
