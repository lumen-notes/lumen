export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value)
}
