import { describe, it, expect, vi, beforeEach } from 'vitest'
import { flushPromises, mount, RouterLinkStub, type VueWrapper } from '@vue/test-utils'

import LoginForm from '../LoginForm.vue'
import { SignInError } from '@/features/auth/services/sessionService'
import { LOGIN_MAX_ATTEMPTS } from '@/features/auth/constants/loginPolicy'
import type { Account, Credentials } from '@/features/auth/types/auth'

const signIn = vi.hoisted(() => vi.fn<(credentials: Credentials) => Promise<Account>>())
const resendConfirmation = vi.hoisted(() =>
  vi.fn<(email: string) => Promise<{ sentAt: string }>>(),
)

vi.mock('@/features/auth/services/sessionService', async (importOriginal) => ({
  // `SignInError` real: o componente decide o que mostrar com `instanceof`.
  ...(await importOriginal<typeof import('@/features/auth/services/sessionService')>()),
  signIn,
}))

vi.mock('@/features/auth/services/emailConfirmationService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/auth/services/emailConfirmationService')>()),
  resendConfirmation,
}))

const TITULAR: Account = {
  name: 'Marina Torres de Almeida',
  email: 'titular@exemplo.com.br',
  role: 'titular',
  emailConfirmed: true,
}

function render(props: Record<string, unknown> = {}) {
  return mount(LoginForm, {
    props,
    global: { stubs: { RouterLink: RouterLinkStub } },
  })
}

async function fill(wrapper: VueWrapper, email = TITULAR.email, password = 'SenhaSegura!123') {
  await wrapper.get('input[autocomplete="email"]').setValue(email)
  await wrapper.get('input[autocomplete="current-password"]').setValue(password)
}

async function submit(wrapper: VueWrapper) {
  await wrapper.get('form').trigger('submit')
  await flushPromises()
}

describe('LoginForm', () => {
  beforeEach(() => {
    signIn.mockReset()
    resendConfirmation.mockReset()
  })

  it('não distingue e-mail errado de senha errada, nem marca um dos campos (RN009)', async () => {
    signIn.mockRejectedValue(new SignInError('credenciais-invalidas'))
    const wrapper = render()
    await fill(wrapper, 'titular@exemplo.com.br', 'senhaerrada')

    await submit(wrapper)

    expect(wrapper.text()).toContain('E-mail ou senha incorretos')
    // Apontar o campo errado revelaria quais endereços têm conta no portal.
    expect(wrapper.findAll('[aria-invalid="true"]')).toHaveLength(0)
  })

  it('conta as tentativas e avisa quantas restam', async () => {
    signIn.mockRejectedValue(new SignInError('credenciais-invalidas'))
    const wrapper = render()
    await fill(wrapper, TITULAR.email, 'senhaerrada')

    await submit(wrapper)
    expect(wrapper.text()).toContain(`Restam ${LOGIN_MAX_ATTEMPTS - 1} tentativas`)

    await submit(wrapper)
    expect(wrapper.text()).toContain(`Tentativas usadas: 2 de ${LOGIN_MAX_ATTEMPTS}`)
  })

  it('bloqueia o acesso na quinta recusa seguida e trava os campos (RN008)', async () => {
    signIn.mockRejectedValue(new SignInError('credenciais-invalidas'))
    const wrapper = render()
    await fill(wrapper, TITULAR.email, 'senhaerrada')

    for (let i = 0; i < LOGIN_MAX_ATTEMPTS; i += 1) await submit(wrapper)

    expect(wrapper.text()).toContain('Acesso bloqueado por 15 minutos')
    expect(wrapper.text()).toContain('até liberar')
    expect(wrapper.get('input[autocomplete="email"]').attributes('disabled')).toBeDefined()
    expect(wrapper.get('button[type="submit"]').attributes('disabled')).toBeDefined()
    expect(wrapper.get('button[type="submit"]').text()).toContain('Acesso bloqueado')
  })

  it('não gasta uma tentativa quando os campos estão vazios', async () => {
    const wrapper = render()

    await submit(wrapper)

    expect(signIn).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('E-mail ou senha incorretos')
    expect(wrapper.text()).not.toContain('Tentativas usadas')
  })

  it('não gasta uma tentativa quando a senha confere e falta confirmar o e-mail (RN005)', async () => {
    signIn.mockRejectedValue(new SignInError('email-nao-confirmado'))
    const wrapper = render()
    await fill(wrapper, 'pendente@exemplo.com.br')

    await submit(wrapper)

    expect(wrapper.text()).toContain('Falta confirmar o e-mail desta conta')
    expect(wrapper.text()).toContain('pendente@exemplo.com.br')
    expect(wrapper.text()).not.toContain('Tentativas usadas')
  })

  it('reenvia o link de confirmação a partir do aviso do RN005', async () => {
    signIn.mockRejectedValue(new SignInError('email-nao-confirmado'))
    resendConfirmation.mockResolvedValue({ sentAt: new Date().toISOString() })
    const wrapper = render()
    await fill(wrapper, 'pendente@exemplo.com.br')
    await submit(wrapper)

    await wrapper.get('button').trigger('click')
    await flushPromises()

    expect(resendConfirmation).toHaveBeenCalledWith('pendente@exemplo.com.br')
    expect(wrapper.text()).toContain('Enviamos outro link para pendente@exemplo.com.br.')
  })

  it('entra e diz qual perfil foi autenticado, sem perguntar na tela', async () => {
    signIn.mockResolvedValue(TITULAR)
    const wrapper = render()
    await fill(wrapper)

    await submit(wrapper)

    expect(signIn).toHaveBeenCalledWith({
      email: TITULAR.email,
      password: 'SenhaSegura!123',
    })
    expect(wrapper.text()).toContain('Autenticado como titular')
    expect(wrapper.text()).toContain('Sessão expira após 30 minutos de inatividade')
    expect(wrapper.find('form').exists()).toBe(false)
  })

  it('anuncia a sessão de 7 dias quando "manter-me conectado" é marcado', async () => {
    signIn.mockResolvedValue(TITULAR)
    const wrapper = render()
    await fill(wrapper)
    await wrapper.get('input[type="checkbox"]').setValue(true)

    await submit(wrapper)

    expect(wrapper.text()).toContain('Token válido por 7 dias')
  })

  it('explica a volta por sessão expirada, quando a rota avisa (RN010)', () => {
    const wrapper = render({ sessionExpired: true })

    expect(wrapper.text()).toContain('Sua sessão expirou por inatividade')
  })

  it('aproveita o e-mail trazido de outra tela', () => {
    const wrapper = render({ initialEmail: 'marina@exemplo.com.br' })

    expect(wrapper.get('input[autocomplete="email"]').element).toHaveProperty(
      'value',
      'marina@exemplo.com.br',
    )
  })

  it('alterna a visibilidade da senha', async () => {
    const wrapper = render()
    const toggle = wrapper.findAll('button').find((button) => button.text() === 'Mostrar senha')

    expect(wrapper.get('input[autocomplete="current-password"]').attributes('type')).toBe('password')

    await toggle!.trigger('click')

    expect(wrapper.get('input[autocomplete="current-password"]').attributes('type')).toBe('text')
    expect(wrapper.text()).toContain('Ocultar senha')
  })
})
