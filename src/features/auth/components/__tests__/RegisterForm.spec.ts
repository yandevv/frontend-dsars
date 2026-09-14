import { describe, it, expect, vi, beforeEach } from 'vitest'
import { flushPromises, mount, RouterLinkStub, type VueWrapper } from '@vue/test-utils'

import RegisterForm from '../RegisterForm.vue'
import { ApiError } from '@/shared/api/ApiError'
import type { NewAccount } from '@/features/auth/types/auth'

const createAccount = vi.hoisted(() => vi.fn<(input: NewAccount) => Promise<string>>())
const push = vi.hoisted(() => vi.fn<(to: unknown) => Promise<void>>())

vi.mock('vue-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('vue-router')>()),
  useRouter: () => ({ push }),
}))

vi.mock('@/features/auth/services/accountService', () => ({ createAccount }))

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
    push.mockReset()
    createAccount.mockResolvedValue('marina@exemplo.com.br')
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

  it('cria a conta e leva à tela de confirmação do e-mail (RN005)', async () => {
    const wrapper = render()
    await fill(wrapper)

    await submit(wrapper)

    expect(createAccount).toHaveBeenCalledWith({
      name: 'Marina Torres de Almeida',
      email: 'marina@exemplo.com.br',
      password: VALID_PASSWORD,
    })
    expect(push).toHaveBeenCalledWith({
      name: 'email-confirmation',
      query: { origem: 'cadastro', email: 'marina@exemplo.com.br' },
    })
  })

  it('mostra a recusa do servidor, campo a campo quando ele a detalha', async () => {
    createAccount.mockRejectedValue(
      new ApiError(400, { detail: 'A senha precisa ter ao menos 12 caracteres.' }),
    )
    const wrapper = render()
    await fill(wrapper)

    await submit(wrapper)

    expect(wrapper.text()).toContain('A senha precisa ter ao menos 12 caracteres.')
    expect(wrapper.find('form').exists()).toBe(true)
  })

  it('explica a falha inesperada sem perder o que foi digitado', async () => {
    createAccount.mockRejectedValue(new ApiError(0))
    const wrapper = render()
    await fill(wrapper)

    await submit(wrapper)

    expect(wrapper.text()).toContain('Não conseguimos criar a conta agora')
    expect(wrapper.get('input[autocomplete="email"]').element).toHaveProperty(
      'value',
      'marina@exemplo.com.br',
    )
  })
})
