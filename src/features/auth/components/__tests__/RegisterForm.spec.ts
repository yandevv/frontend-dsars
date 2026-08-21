import { describe, it, expect, vi, beforeEach } from 'vitest'
import { flushPromises, mount, RouterLinkStub, type VueWrapper } from '@vue/test-utils'

import RegisterForm from '../RegisterForm.vue'
import { AccountError } from '@/features/auth/services/accountService'
import type { Account, NewAccount } from '@/features/auth/types/auth'

const createAccount = vi.hoisted(() => vi.fn<(input: NewAccount) => Promise<Account>>())
const resendConfirmation = vi.hoisted(() => vi.fn<(email: string) => Promise<void>>())

vi.mock('@/features/auth/services/accountService', async (importOriginal) => ({
  // `AccountError` real: o componente decide o que mostrar com `instanceof`.
  ...(await importOriginal<typeof import('@/features/auth/services/accountService')>()),
  createAccount,
  resendConfirmation,
}))

const VALID_PASSWORD = 'SenhaSegura!123'

function render() {
  return mount(RegisterForm, {
    global: { stubs: { RouterLink: RouterLinkStub } },
  })
}

interface FormInput {
  name?: string
  email?: string
  password?: string
  confirmation?: string
  terms?: boolean
}

async function fill(wrapper: VueWrapper, input: FormInput = {}) {
  const {
    name = 'Marina Torres de Almeida',
    email = 'marina@exemplo.com.br',
    password = VALID_PASSWORD,
    confirmation = password,
    terms = true,
  } = input

  await wrapper.get('input[autocomplete="name"]').setValue(name)
  await wrapper.get('input[autocomplete="email"]').setValue(email)

  const passwords = wrapper.findAll('input[type="password"]')
  await passwords[0]!.setValue(password)
  await passwords[1]!.setValue(confirmation)

  if (terms) await wrapper.get('input[type="checkbox"]').setValue(true)
}

async function submit(wrapper: VueWrapper) {
  await wrapper.get('form').trigger('submit')
  await flushPromises()
}

describe('RegisterForm', () => {
  beforeEach(() => {
    createAccount.mockReset()
    resendConfirmation.mockReset()
    createAccount.mockResolvedValue({
      name: 'Marina Torres de Almeida',
      email: 'marina@exemplo.com.br',
      role: 'titular',
      emailConfirmed: false,
    })
  })

  it('mostra os critérios de senha desde o início, antes de qualquer envio', () => {
    const text = render().text()

    expect(text).toContain('Ao menos 12 caracteres')
    expect(text).toContain('Uma letra maiúscula')
    expect(text).toContain('Um caractere especial, como ! ? @ #')
  })

  it('não chama o serviço enquanto o formulário está incompleto', async () => {
    const wrapper = render()

    await submit(wrapper)

    expect(createAccount).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Ainda não é possível criar a conta')
  })

  it('aponta o e-mail malformado e o aceite pendente ao tentar enviar', async () => {
    const wrapper = render()
    await fill(wrapper, { email: 'marina@', terms: false })

    await submit(wrapper)

    expect(wrapper.text()).toContain('Um e-mail tem o formato nome@dominio.com.br.')
    expect(wrapper.text()).toContain('O aceite é obrigatório para criar a conta.')
    expect(createAccount).not.toHaveBeenCalled()
  })

  it('avisa quando a confirmação diverge, sem esperar o envio', async () => {
    const wrapper = render()
    await fill(wrapper, { confirmation: 'OutraSenha!123' })

    expect(wrapper.text()).toContain('As duas senhas precisam ser iguais.')
  })

  it('confirma quando as duas senhas coincidem', async () => {
    const wrapper = render()
    await fill(wrapper)

    expect(wrapper.text()).toContain('As senhas coincidem.')
  })

  it('cria a conta e mostra a pendência de confirmação do RN005', async () => {
    const wrapper = render()
    await fill(wrapper)

    await submit(wrapper)

    expect(createAccount).toHaveBeenCalledWith({
      name: 'Marina Torres de Almeida',
      email: 'marina@exemplo.com.br',
      password: VALID_PASSWORD,
    })
    expect(wrapper.text()).toContain('Conta criada. Falta confirmar o e-mail.')
    expect(wrapper.text()).toContain('marina@exemplo.com.br')
    expect(wrapper.find('form').exists()).toBe(false)
  })

  it('oferece as duas saídas quando o e-mail já tem conta (RN004)', async () => {
    createAccount.mockRejectedValue(new AccountError('email-em-uso'))
    const wrapper = render()
    await fill(wrapper)

    await submit(wrapper)

    expect(wrapper.text()).toContain('Já existe uma conta com este e-mail')

    const destinations = wrapper
      .findAllComponents(RouterLinkStub)
      .map((link) => link.props('to'))
      .filter((to): to is { name: string } => typeof to === 'object' && to !== null && 'name' in to)
      .map((to) => to.name)

    expect(destinations).toContain('login')
    expect(destinations).toContain('password-recovery')
    // O formulário continua disponível para trocar o endereço.
    expect(wrapper.find('form').exists()).toBe(true)
  })

  it('explica a falha inesperada sem perder o que foi digitado', async () => {
    createAccount.mockRejectedValue(new Error('rede indisponível'))
    const wrapper = render()
    await fill(wrapper)

    await submit(wrapper)

    expect(wrapper.text()).toContain('Não conseguimos criar a conta agora')
    expect(wrapper.get('input[autocomplete="email"]').element).toHaveProperty(
      'value',
      'marina@exemplo.com.br',
    )
  })

  it('reenvia o link de confirmação a partir da tela de sucesso', async () => {
    resendConfirmation.mockResolvedValue(undefined)
    const wrapper = render()
    await fill(wrapper)
    await submit(wrapper)

    await wrapper.get('button').trigger('click')
    await flushPromises()

    expect(resendConfirmation).toHaveBeenCalledWith('marina@exemplo.com.br')
    expect(wrapper.text()).toContain('Enviamos outro link para marina@exemplo.com.br.')
  })
})
