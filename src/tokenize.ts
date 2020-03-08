// @ts-ignore
import * as nameToEmoji from 'gemoji/name-to-emoji'

function normalize(src: string) {
  const unicodeNormalized = src.normalize('NFKC')
  const emojiNormalized = unicodeNormalized.replace(/:([a-z0-9\+\-_]+):/g, (_, name) => {
    return nameToEmoji[name] ?? name
  })
  return emojiNormalized
}

function filterTokens(tokens: readonly string[]): string[] {
  return tokens.filter(token => /^([^\p{Punctuation}\p{White_Space}\p{Math_Symbol}]|[@])+$/u.test(token))
}

function bigram(codes: readonly string[]) {
  if (codes.length < 2) return []
  const result = []
  for (let i = 0; i < codes.length - 1; i++) {
    const token = codes.slice(i, i + 2).join('')
    result.push(token)
  }
  return result
}

export function tokenizeText(text: string): Record<string, true> {
  const codes = [...normalize(text)] // array of codepoint
  const unigram = codes
  const set = new Set<string>(filterTokens([/* unigram */ ...unigram, ...bigram(codes)]))
  const result: Record<string, true> = {}
  for (const item of set) {
    result[item] = true
  }
  return result
}

export function tokenizeQueries(queries: readonly string[]) {
  const normalizedQueries = queries.map(normalize)
  const tokens = normalizedQueries.flatMap(q => {
    const codes = [...q]
    return codes.length >= 2 ? bigram(codes) : codes
  })
  return { queries: normalizedQueries, tokens: filterTokens([...new Set(tokens)]) }
}
