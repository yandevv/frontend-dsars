/**
 * "Chrome em Windows", a partir do `User-Agent` que o servidor registrou.
 *
 * Só o suficiente para a pessoa reconhecer o próprio aparelho: a ordem das
 * conferências importa, porque o Edge e o Opera também se dizem Chrome, e o
 * Chrome se diz Safari.
 */
const BROWSERS: readonly [RegExp, string][] = [
  [/Edg\//, 'Edge'],
  [/OPR\/|Opera/, 'Opera'],
  [/Firefox\//, 'Firefox'],
  [/Chrome\/|CriOS\//, 'Chrome'],
  [/Safari\//, 'Safari'],
]

const SYSTEMS: readonly [RegExp, string][] = [
  [/iPhone/, 'iPhone'],
  [/iPad/, 'iPad'],
  [/Android/, 'Android'],
  [/Windows/, 'Windows'],
  [/Mac OS X|Macintosh/, 'macOS'],
  [/Ubuntu/, 'Ubuntu'],
  [/Linux/, 'Linux'],
]

function firstMatch(value: string, table: readonly [RegExp, string][]): string | undefined {
  return table.find(([pattern]) => pattern.test(value))?.[1]
}

export function describeUserAgent(userAgent: string | null | undefined): string {
  if (!userAgent) return 'Aparelho não identificado'
  const browser = firstMatch(userAgent, BROWSERS)
  const system = firstMatch(userAgent, SYSTEMS)
  if (browser && system) return `${browser} em ${system}`
  return browser ?? system ?? 'Aparelho não identificado'
}
