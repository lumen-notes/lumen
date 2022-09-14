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

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value)
}
