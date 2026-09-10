import { DEMO_PASSWORD, findDemoAccount, normalizeEmail } from '@/features/auth/data/accounts'
import { PASSWORD_RULES } from '@/features/auth/constants/passwordPolicy'
import { delay } from '@/features/auth/services/fakeNetwork'
import { daysFromNow } from '@/shared/utils/date'
import { inboxOf, notify } from '@/features/notifications/composables/useNotifications'
import type { Account } from '@/features/auth/types/auth'
import type { AccountSession, SecurityOverview } from '@/features/settings/types/security'

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * ATENÇÃO — aqui entra a API de segurança da conta.
 *
 * Senha e sessões vivem em memória, por conta. A senha nunca seria guardada
 * assim num servidor — lá ela existe só como hash com salt, e a comparação é
 * feita entre hashes. Aqui ela fica em texto porque não há servidor nenhum, e
 * some junto com este módulo.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type SecurityRefusal = 'senha-incorreta' | 'senha-fraca' | 'senha-repetida' | 'sessao-atual'

export class SecurityError extends Error {
  constructor(readonly refusal: SecurityRefusal) {
    super(refusal)
    this.name = 'SecurityError'
  }
}

interface SecurityState {
  password: string
  passwordChangedAt: string
  sessions: AccountSession[]
}

/** Momento a `days` dias de hoje, `hours` horas antes de agora quando `days` é zero. */
function ago(days: number, hours = 0): string {
  return new Date(new Date(daysFromNow(-days)).getTime() - hours * 3_600_000).toISOString()
}

/** As sessões de demonstração do design: a atual e três em outros aparelhos. */
function demoSessions(): AccountSession[] {
  const now = new Date().toISOString()
  return [
    {
      id: 'sessao-atual',
      device: 'Chrome em Windows',
      origin: 'Franca, SP · 177.44.12.90',
      startedAt: ago(0, 1),
      lastSeenAt: now,
      current: true,
    },
    {
      id: 'sessao-iphone',
      device: 'Safari em iPhone',
      origin: 'Franca, SP · rede móvel',
      startedAt: ago(0, 3),
      lastSeenAt: ago(0, 2),
      current: false,
    },
    {
      id: 'sessao-ubuntu',
      device: 'Firefox em Ubuntu',
      origin: 'Ribeirão Preto, SP · 189.27.4.11',
      startedAt: ago(5, 1),
      lastSeenAt: ago(5),
      current: false,
    },
    {
      id: 'sessao-desconhecida',
      device: 'Chrome em Android',
      origin: 'Origem não reconhecida · 45.161.8.72',
      startedAt: ago(14, 1),
      lastSeenAt: ago(14),
      current: false,
    },
  ]
}

const states = new Map<string, SecurityState>()

function stateOf(email: string): SecurityState {
  const key = normalizeEmail(email)
  let state = states.get(key)
  if (!state) {
    state = {
      password: findDemoAccount(key)?.password ?? DEMO_PASSWORD,
      passwordChangedAt: ago(116),
      sessions: demoSessions(),
    }
    states.set(key, state)
  }
  return state
}

function overview(state: SecurityState): SecurityOverview {
  return { passwordChangedAt: state.passwordChangedAt, sessions: state.sessions.map((s) => ({ ...s })) }
}

/**
 * A senha vigente da conta, para o acesso conferir. Existe para que a troca
 * feita nas configurações valha no login seguinte.
 */
export function currentPasswordOf(email: string): string {
  return stateOf(email).password
}

export async function fetchSecurity(email: string): Promise<SecurityOverview> {
  await delay()
  return overview(stateOf(email))
}

/** Todo evento de segurança gera aviso, e esse aviso não pode ser desligado. */
function securityNotice(account: Pick<Account, 'role' | 'email'>, title: string, detail: string) {
  notify(inboxOf(account), {
    type: 'Segurança da conta',
    tone: 'alerta',
    title,
    detail,
    target: { name: 'security-settings' },
  })
}

/**
 * Troca a senha: exige a atual, aplica os critérios de senha forte e encerra
 * todas as outras sessões — só o aparelho em que a troca foi feita continua
 * conectado.
 */
export async function changePassword(
  account: Pick<Account, 'role' | 'email'>,
  { current, next }: { current: string; next: string },
): Promise<SecurityOverview & { endedSessions: number }> {
  await delay()
  const state = stateOf(account.email)

  if (current !== state.password) throw new SecurityError('senha-incorreta')
  if (!PASSWORD_RULES.every((rule) => rule.test(next))) throw new SecurityError('senha-fraca')
  if (next === state.password) throw new SecurityError('senha-repetida')

  const endedSessions = state.sessions.filter((session) => !session.current).length
  state.password = next
  state.passwordChangedAt = new Date().toISOString()
  state.sessions = state.sessions.filter((session) => session.current)

  securityNotice(
    account,
    'Sua senha foi alterada',
    endedSessions > 0
      ? `As outras ${endedSessions} sessões foram encerradas. Se não foi você, fale com a encarregada de proteção de dados.`
      : 'Se não foi você, fale com a encarregada de proteção de dados.',
  )

  return { ...overview(state), endedSessions }
}

/** Encerra uma sessão de outro aparelho. A atual se encerra pelo "Sair". */
export async function endSession(
  account: Pick<Account, 'role' | 'email'>,
  sessionId: string,
): Promise<SecurityOverview> {
  await delay()
  const state = stateOf(account.email)
  const session = state.sessions.find((item) => item.id === sessionId)
  if (!session) return overview(state)
  if (session.current) throw new SecurityError('sessao-atual')

  state.sessions = state.sessions.filter((item) => item.id !== sessionId)
  securityNotice(account, 'Uma sessão foi encerrada', `${session.device} · ${session.origin}.`)
  return overview(state)
}

export async function endOtherSessions(
  account: Pick<Account, 'role' | 'email'>,
): Promise<SecurityOverview & { endedSessions: number }> {
  await delay()
  const state = stateOf(account.email)
  const endedSessions = state.sessions.filter((session) => !session.current).length

  state.sessions = state.sessions.filter((session) => session.current)
  if (endedSessions > 0) {
    securityNotice(
      account,
      `${endedSessions} ${endedSessions === 1 ? 'sessão encerrada' : 'sessões encerradas'}`,
      'Só este aparelho continua conectado à conta.',
    )
  }
  return { ...overview(state), endedSessions }
}
