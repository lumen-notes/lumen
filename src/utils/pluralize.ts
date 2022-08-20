export function pluralize(count: number, noun: string, suffix: string = "s") {
  return `${formatNumber(count)} ${noun}${count !== 1 ? suffix : ""}`
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value)
}
