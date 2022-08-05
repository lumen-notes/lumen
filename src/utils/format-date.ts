const MONTHS = {
  1: "Jan",
  2: "Feb",
  3: "Mar",
  4: "Apr",
  5: "May",
  6: "Jun",
  7: "Jul",
  8: "Aug",
  9: "Sep",
  10: "Oct",
  11: "Nov",
  12: "Dec",
}

const DAYS_OF_WEEK = {
  1: "Mon",
  2: "Tue",
  3: "Wed",
  4: "Thu",
  5: "Fri",
  6: "Sat",
  0: "Sun",
}

export function formatDate(dateString: string) {
  const date = new Date(dateString)
  const currentYear = new Date().getUTCFullYear()
  const year = date.getUTCFullYear()
  const month = (date.getUTCMonth() + 1) as keyof typeof MONTHS
  const day = date.getUTCDate()
  const dayOfWeek = date.getUTCDay() as keyof typeof DAYS_OF_WEEK

  let formattedDate = `${DAYS_OF_WEEK[dayOfWeek]}, ${MONTHS[month]} ${day}`

  // Only show the year if it's not the current year
  if (year !== currentYear) {
    formattedDate += `, ${year}`
  }

  return formattedDate
}
