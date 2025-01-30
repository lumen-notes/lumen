import {
  addDays,
  differenceInCalendarISOWeeks,
  formatDistance,
  getISOWeek,
  getISOWeekYear,
  isSameDay,
  parseISO,
  startOfToday,
  subDays,
} from "date-fns"

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

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

const WEEK_REGEX = /^(?<year>\d{4})-W(?<week>\d{2})$/

/** Checks if string is a valid date in ISO format (YYYY-MM-DD) */
export function isValidDateString(dateString: string) {
  return DATE_REGEX.test(dateString) && !isNaN(Date.parse(dateString))
}

/** Checks if string is a valid week in ISO format (YYYY-W##) */
export function isValidWeekString(weekString: string) {
  const match = weekString.match(WEEK_REGEX)
  if (!match) return false
  const { year, week } = match.groups!
  return !isNaN(Date.parse(`${year}-01-01`)) && Number(week) >= 1 && Number(week) <= 53
}

export function isValidUnixTimestamp(value: string): boolean {
  if (value === "") return false
  const timestamp = Number(value)
  const isNumber = !isNaN(timestamp)
  const isPositive = timestamp >= 0
  const isInteger = Number.isInteger(timestamp)
  return isNumber && isPositive && isInteger
}

/**
 * Formats a date string
 *
 * @example
 * formatDate("1998-07-11") // "Tue, Jul 11 1998"
 */
export function formatDate(
  dateString: string,
  {
    excludeDayOfWeek = false,
    alwaysIncludeYear = false,
  }: { excludeDayOfWeek?: boolean; alwaysIncludeYear?: boolean } = {},
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

  // Only show the year if it's not the current year or alwaysIncludeYear is true
  if (year !== currentYear || alwaysIncludeYear) {
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

/**
 * Formats a week string
 *
 * @example
 * formatWeek("1998-W07") // "Week 7, 1998"
 */
export function formatWeek(weekString: string) {
  if (!isValidWeekString(weekString)) {
    throw new Error(`Invalid week: ${weekString}`)
  }

  const match = weekString.match(WEEK_REGEX)
  if (!match) return ""
  const { year, week } = match.groups!
  return `Week ${Number(week)}, ${Number(year)}`
}

/**
 * Formats a week string to show the distance from the current week
 *
 * @example
 * formatWeekDistance("2021-W07") // "This week"
 * formatWeekDistance("2021-W08") // "Next week"
 * formatWeekDistance("2021-W06") // "Last week"
 * formatWeekDistance("2020-W07") // "52 weeks ago"
 * formatWeekDistance("2022-W07") // "In 52 weeks"
 */
export function formatWeekDistance(weekString: string) {
  const weekDate = parseISO(weekString)
  const currentDate = startOfToday()
  const weeksDiff = differenceInCalendarISOWeeks(weekDate, currentDate)

  if (weeksDiff === 0) {
    return "This week"
  } else if (weeksDiff === 1) {
    return "Next week"
  } else if (weeksDiff === -1) {
    return "Last week"
  } else if (weeksDiff < 0) {
    return `${Math.abs(weeksDiff)} weeks ago`
  } else {
    return `In ${Math.abs(weeksDiff)} weeks`
  }
}

/** Converts a date to a string in the format "YYYY-MM-DD" */
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

export function toWeekString(date: Date) {
  const year = getISOWeekYear(date).toString().padStart(4, "0")
  const weekNumber = getISOWeek(date).toString().padStart(2, "0")
  return `${year}-W${weekNumber}`
}

export function getNextBirthday(birthday: Date): Date {
  const today = new Date()
  const currentYear = today.getFullYear()
  const birthMonth = birthday.getUTCMonth()
  const birthDay = birthday.getUTCDate()
  const nextBirthday = new Date(currentYear, birthMonth, birthDay)

  // Reset the time to 00:00:00
  today.setHours(0, 0, 0, 0)

  if (nextBirthday.valueOf() < today.valueOf()) {
    nextBirthday.setFullYear(currentYear + 1)
  }

  return nextBirthday
}
