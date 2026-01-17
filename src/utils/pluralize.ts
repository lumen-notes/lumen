/**
 * Pluralizes a noun if count is greater than 1
 *
 * @example
 * pluralize(1, "dog") // "1 dog"
 * pluralize(2, "dog") // "2 dogs"
 */
export function pluralize(count: number, noun: string, suffix = "s") {
  return `${formatNumber(count)} ${noun}${count !== 1 ? suffix : ""}`
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value)
}

/** Adds the appropriate ordinal suffix to a number (e.g. "1st", "2nd", "3rd", "4th", etc.) */
export function withOrdinalSuffix(num: number): string {
  const lastDigit = num % 10
  const lastTwoDigits = num % 100

  if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
    return `${num}th`
  }

  switch (lastDigit) {
    case 1:
      return `${num}st`
    case 2:
      return `${num}nd`
    case 3:
      return `${num}rd`
    default:
      return `${num}th`
  }
}
