import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'

import DataSubjectRights from '../DataSubjectRights.vue'

function render() {
  return mount(DataSubjectRights)
}

describe('DataSubjectRights', () => {
  it('lista os nove incisos do art. 18 na ordem da lei', () => {
    const items = render().findAll('li')

    expect(items).toHaveLength(9)
    expect(items.map((item) => item.find('span').text())).toEqual([
      'I',
      'II',
      'III',
      'IV',
      'V',
      'VI',
      'VII',
      'VIII',
      'IX',
    ])
  })

  it('descreve cada direito em linguagem acessível', () => {
    const text = render().text()

    expect(text).toContain('Confirmação de tratamento')
    expect(text).toContain('Portabilidade')
    expect(text).toContain('Revogação do consentimento')
  })

  it('usa uma lista ordenada de verdade, e não uma pilha de divs', () => {
    const list = render().get('ol')

    // O reset do Tailwind remove o marcador, e sem role o Safari deixa de
    // anunciar a semântica de lista.
    expect(list.attributes('role')).toBe('list')
  })
})
