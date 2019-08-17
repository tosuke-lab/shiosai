export function tokenize(src: string): string[] {
  const codes = [...src]
  if (codes.length < 2) return codes
  const result = new Set<string>()
  for (let i = 0; i < codes.length - 1; i++) {
    result.add(codes[i] + codes[i + 1])
  }
  return [...result]
}
