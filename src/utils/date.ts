import { addDays, formatDistance, isSameDay, subDays } from "date-fns"

export const monthNames = {
  1: "January",
  2: "February",
  3: "March",
  4: "April",
  5: "May",
  6: "June",
  7: "July",
  8: "August",
  9: "September",
  10: "October",
  11: "November",
  12: "December",
}

export const dayNames = {
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
  0: "Sunday",
}

export function formatDate(dateString: string) {
  const date = new Date(dateString)
  const currentYear = new Date().getUTCFullYear()
  const year = date.getUTCFullYear()
  const month = (date.getUTCMonth() + 1) as keyof typeof monthNames
  const day = date.getUTCDate()
  const dayOfWeek = date.getUTCDay() as keyof typeof dayNames

  let formattedDate = `${dayNames[dayOfWeek].slice(0, 3)}, ${monthNames[month].slice(0, 3)} ${day}`

  // Only show the year if it's not the current year
  if (year !== currentYear) {
    formattedDate += ` ${year}`
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
