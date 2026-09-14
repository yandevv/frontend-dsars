import { describe, it, expect, vi, beforeEach } from 'vitest'
import { flushPromises, mount, RouterLinkStub, type VueWrapper } from '@vue/test-utils'

import LoginForm from '../LoginForm.vue'
import { ApiError } from '@/shared/api/ApiError'
import type { Account, Credentials } from '@/features/auth/types/auth'

const signIn = vi.hoisted(() => vi.fn<(credentials: Credentials) => Promise<Account>>())

vi.mock('@/features/auth/services/sessionService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/auth/services/sessionService')>()),
  signIn,
}))

const replace = vi.hoisted(() => vi.fn<(to: unknown) => Promise<void>>(() => Promise.resolve()))
const query = vi.hoisted(() => ({ value: {} as Record<string, string> }))
vi.mock('vue-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('vue-router')>()),
  useRouter: () => ({ replace }),
  useRoute: () => ({ query: query.value }),
}))

const GENERIC =
  'Não foi possível entrar. Verifique os dados informados ou aguarde alguns minutos antes de tentar novamente.'

const TITULAR: Account = {
  id: 'conta-1',
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
    replace.mockClear()
    query.value = {}
  })

  it('repete a recusa do servidor sem marcar um dos campos (RN009)', async () => {
    signIn.mockRejectedValue(new ApiError(401, { detail: GENERIC }))
    const wrapper = render()
    await fill(wrapper, 'titular@exemplo.com.br', 'senhaerrada')

    await submit(wrapper)

    expect(wrapper.text()).toContain('Não foi possível entrar')
    expect(wrapper.text()).toContain('aguarde alguns minutos')
    // Apontar o campo errado revelaria quais endereços têm conta no portal.
    expect(wrapper.findAll('[aria-invalid="true"]')).toHaveLength(0)
  })

  it('não chama o servidor quando os campos estão vazios', async () => {
    const wrapper = render()

    await submit(wrapper)

    expect(signIn).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Informe o e-mail e a senha')
  })

  it('diferencia falha de conexão de credencial recusada', async () => {
    signIn.mockRejectedValue(new ApiError(0))
    const wrapper = render()
    await fill(wrapper)

    await submit(wrapper)

    expect(wrapper.text()).toContain('Não conseguimos verificar o acesso agora')
  })

  it('entra e leva o titular aos próprios pedidos, sem perguntar o perfil', async () => {
    signIn.mockResolvedValue(TITULAR)
    const wrapper = render()
    await fill(wrapper)

    await submit(wrapper)

    expect(signIn).toHaveBeenCalledWith({
      email: TITULAR.email,
      password: 'SenhaSegura!123',
      rememberMe: false,
    })
    expect(replace).toHaveBeenCalledWith({ name: 'my-requests' })
  })

  it('volta à tela que pediu o acesso', async () => {
    query.value = { redirect: '/requisicoes/nova' }
    signIn.mockResolvedValue(TITULAR)
    const wrapper = render()
    await fill(wrapper)

    await submit(wrapper)

    expect(replace).toHaveBeenCalledWith('/requisicoes/nova')
  })

  it('não segue um redirecionamento para fora do portal', async () => {
    query.value = { redirect: '//exemplo.com/phishing' }
    signIn.mockResolvedValue(TITULAR)
    const wrapper = render()
    await fill(wrapper)

    await submit(wrapper)

    expect(replace).toHaveBeenCalledWith({ name: 'my-requests' })
  })

  it('leva a encarregada à fila da organização', async () => {
    signIn.mockResolvedValue({
      ...TITULAR,
      email: 'helena.vasconcelos@meridianosaude.org.br',
      role: 'encarregado',
    })
    const wrapper = render()
    await fill(wrapper)

    await submit(wrapper)

    expect(replace).toHaveBeenCalledWith({ name: 'request-queue' })
  })

  it('diz antes de entrar quanto tempo a sessão vale', async () => {
    const wrapper = render()
    expect(wrapper.text()).toContain('A sessão expira após 30 minutos sem atividade.')

    await wrapper.get('input[type="checkbox"]').setValue(true)
    expect(wrapper.text()).toContain('A sessão vale por 7 dias neste aparelho.')
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
