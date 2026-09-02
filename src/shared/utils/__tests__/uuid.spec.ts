import { describe, it, expect } from 'vitest'

import { isUuidV7, uuidv7 } from '../uuid'

describe('uuidv7', () => {
  it('segue o formato da versão 7, com a variante da RFC', () => {
    const id = uuidv7()

    expect(isUuidV7(id)).toBe(true)
    expect(id[14]).toBe('7')
    expect('89ab').toContain(id[19])
  })

  it('guarda o instante de criação nos primeiros 48 bits', () => {
    const now = Date.UTC(2026, 8, 24, 12, 0, 0)
    const id = uuidv7(now)

    expect(parseInt(id.replace(/-/g, '').slice(0, 12), 16)).toBe(now)
  })

  it('ordena pela data de criação', () => {
    const earlier = uuidv7(Date.UTC(2026, 0, 1))
    const later = uuidv7(Date.UTC(2026, 0, 2))

    expect(earlier < later).toBe(true)
  })

  it('não repete identificadores', () => {
    const ids = new Set(Array.from({ length: 500 }, () => uuidv7()))

    expect(ids.size).toBe(500)
  })

  it('rejeita o formato antigo dos identificadores', () => {
    expect(isUuidV7('req_9f3c41a8-2026-0418')).toBe(false)
  })
})
