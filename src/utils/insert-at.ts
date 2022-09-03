/** Insert value at index */
export function insertAt<T>(array: T[], index: number, value: T): T[] {
  const result = [...array]
  result.splice(index, 0, value)
  return result
}
