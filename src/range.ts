export function createRangeIndex(value: number): Record<string, number> {
  const result: Record<string, number> = {}
  for (let i = 0; i < 32; i++) {
    result[`${i}`] = value >>> i
  }
  return result
}
