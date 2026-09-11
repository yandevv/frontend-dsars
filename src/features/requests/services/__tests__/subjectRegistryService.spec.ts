import { describe, it, expect, vi } from 'vitest'

import { searchSubjects } from '../subjectRegistryService'

vi.mock('@/features/auth/services/fakeNetwork', () => ({ delay: () => Promise.resolve() }))

const names = async (query: string) => (await searchSubjects(query)).map((subject) => subject.name)

describe('subjectRegistryService', () => {
  it('acha pelo nome, sem ligar para acento ou maiúscula', async () => {
    expect(await names('prado')).toEqual(['Joana Prado Vasconcelos'])
    expect(await names('IARA bonfim')).toEqual(['Iara Bonfim Castro'])
  })

  it('acha pelo e-mail', async () => {
    expect(await names('titular@exemplo')).toEqual(['Marina Torres de Almeida'])
  })

  it('acha por parte do CPF, com ou sem pontuação', async () => {
    expect(await names('476.201')).toEqual(['Marina Torres de Almeida'])
    expect(await names('92711463017')).toEqual(['Joana Prado Vasconcelos'])
  })

  it('não busca com menos de três caracteres', async () => {
    expect(await searchSubjects('ma')).toEqual([])
  })

  it('devolve vazio quando ninguém corresponde', async () => {
    expect(await searchSubjects('Wagner Sipriano')).toEqual([])
  })
})
