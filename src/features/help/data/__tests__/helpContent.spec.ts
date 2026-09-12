import { describe, it, expect } from 'vitest'

import { GLOSSARY, faqFor, sectionsFor } from '../helpContent'
import {
  CANCEL_REASON_MIN_LENGTH,
  MESSAGE_EDIT_WINDOW_MINUTES,
} from '@/features/requests/constants/requestPolicy'

const allText = (role: 'titular' | 'encarregado') =>
  JSON.stringify([sectionsFor(role), faqFor(role), GLOSSARY])

describe('helpContent', () => {
  it('ensina as regras com os mesmos números das telas', () => {
    const text = allText('titular')

    expect(text).toContain(`pelo menos ${CANCEL_REASON_MIN_LENGTH} caracteres`)
    expect(text).toContain(`em até ${MESSAGE_EDIT_WINDOW_MINUTES} minutos`)
  })

  it('não mostra códigos de requisito nem artigos de lei', () => {
    for (const role of ['titular', 'encarregado'] as const) {
      expect(allText(role)).not.toMatch(/\bRNF?\d{3}\b|\bRF\d{3}\b|art\.\s*\d/)
    }
  })

  it('dá a cada seção uma âncora única', () => {
    for (const role of ['titular', 'encarregado'] as const) {
      const ids = sectionsFor(role).map((section) => section.id)
      expect(new Set(ids).size).toBe(ids.length)
    }
  })
})
