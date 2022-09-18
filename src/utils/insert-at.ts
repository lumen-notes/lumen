/**
 * Inserts value at index
 *
 * @example
 * insertAt([1, 2, 3], 1, 4) // [1, 4, 2, 3]
 * insertAt([1, 2, 3], 0, 4) // [4, 1, 2, 3]
 */
export function insertAt<T>(array: T[], index: number, value: T): T[] {
  const result = [...array]
  result.splice(index, 0, value)
  return result
}
