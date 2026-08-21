import { describe, it, expect } from 'vitest'
import { ref } from 'vue'

import { usePasswordPolicy } from '../usePasswordPolicy'

describe('usePasswordPolicy', () => {
  it('lista os três critérios do RN002, na ordem do design', () => {
    const { checks } = usePasswordPolicy('')

    expect(checks.value.map((check) => check.label)).toEqual([
      'Ao menos 12 caracteres',
      'Uma letra maiúscula',
      'Um caractere especial, como ! ? @ #',
    ])
  })

  it.each([
    ['', [false, false, false]],
    ['curta!A', [false, true, true]],
    ['minusculasomente', [true, false, false]],
    ['SenhaSemSimbolo', [true, true, false]],
    ['SenhaSegura!123', [true, true, true]],
  ])('confere %s contra os critérios', (password, expected) => {
    const { checks } = usePasswordPolicy(password)

    expect(checks.value.map((check) => check.met)).toEqual(expected)
  })

  it('só é válida quando todos os critérios são atendidos', () => {
    expect(usePasswordPolicy('SenhaSemSimbolo').isValid.value).toBe(false)
    expect(usePasswordPolicy('SenhaSegura!123').isValid.value).toBe(true)
  })

  it('acompanha a senha enquanto ela é digitada', () => {
    const password = ref('')
    const { strength, isValid } = usePasswordPolicy(password)

    expect(strength.value.label).toBe('Ainda em branco')

    password.value = 'a'
    expect(strength.value.label).toBe('Muito fraca')

    password.value = 'senhalongademais'
    expect(strength.value.label).toBe('Fraca')

    password.value = 'SenhaLongaDemais'
    expect(strength.value.label).toBe('Média')

    password.value = 'SenhaSegura!123'
    expect(strength.value.label).toBe('Forte')
    expect(strength.value.width).toBe('100%')
    expect(isValid.value).toBe(true)
  })
})
